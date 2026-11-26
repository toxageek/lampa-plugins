#!/usr/bin/env python3
"""
Минимальный zipalign: выравнивает данные несжатых (STORED) файлов APK
на 4 байта (.so — на 4096), дописывая нули в extra-поле локального заголовка.
Сжатые данные копируются байт-в-байт, без пережатия.

Нужен, только когда в системе нет zipalign из Android build-tools
(build.sh берёт его, если есть). Android 11+ отказывается ставить APK
с невыровненным несжатым resources.arsc.

    zipalign.py IN.apk OUT.apk   — выровнять
    zipalign.py --check APK      — проверить (код выхода 1, если не выровнен)
"""
import struct
import sys
import zipfile

LOCAL_SIG = 0x04034B50
CENTRAL_SIG = 0x02014B50
END_SIG = 0x06054B50
DATA_DESCRIPTOR_FLAG = 0x08


def alignment_for(name: bytes) -> int:
    return 4096 if name.endswith(b".so") else 4


def local_header(data: bytes, offset: int):
    fields = struct.unpack("<IHHHHHIIIHH", data[offset:offset + 30])
    if fields[0] != LOCAL_SIG:
        raise ValueError(f"нет локального заголовка по смещению {offset}")
    name_len, extra_len = fields[9], fields[10]
    name = data[offset + 30:offset + 30 + name_len]
    extra = data[offset + 30 + name_len:offset + 30 + name_len + extra_len]
    return fields, name, extra, offset + 30 + name_len + extra_len


def align(src: str, dst: str) -> None:
    data = open(src, "rb").read()
    entries = zipfile.ZipFile(src).infolist()

    out = bytearray()
    central = bytearray()

    for info in entries:
        fields, name, extra, data_start = local_header(data, info.header_offset)
        _, version, flags, method, mtime, mdate = fields[:6]
        payload = data[data_start:data_start + info.compress_size]
        # Дескриптор данных убираем: CRC и размеры пишем прямо в заголовок.
        flags &= ~DATA_DESCRIPTOR_FLAG

        offset = len(out)
        if method == zipfile.ZIP_STORED:
            pad = -(offset + 30 + len(name) + len(extra)) % alignment_for(name)
            extra += b"\0" * pad

        out += struct.pack("<IHHHHHIIIHH", LOCAL_SIG, version, flags, method, mtime, mdate,
                           info.CRC, info.compress_size, info.file_size, len(name), len(extra))
        out += name + extra + payload

        central_extra = info.extra
        comment = info.comment
        central += struct.pack("<IBBHHHHHIIIHHHHHII", CENTRAL_SIG,
                               info.create_version, info.create_system, version, flags, method,
                               mtime, mdate, info.CRC, info.compress_size, info.file_size,
                               len(name), len(central_extra), len(comment),
                               0, info.internal_attr, info.external_attr, offset)
        central += name + central_extra + comment

    central_offset = len(out)
    out += central
    out += struct.pack("<IHHHHIIH", END_SIG, 0, 0, len(entries), len(entries),
                       len(central), central_offset, 0)

    with open(dst, "wb") as fh:
        fh.write(out)


def check(path: str) -> bool:
    data = open(path, "rb").read()
    ok = True
    for info in zipfile.ZipFile(path).infolist():
        if info.compress_type != zipfile.ZIP_STORED:
            continue
        _, name, _, data_start = local_header(data, info.header_offset)
        if data_start % alignment_for(name):
            print(f"не выровнен: {info.filename} (смещение {data_start})", file=sys.stderr)
            ok = False
    return ok


def main(argv) -> int:
    if len(argv) == 3 and argv[1] == "--check":
        return 0 if check(argv[2]) else 1
    if len(argv) == 3:
        align(argv[1], argv[2])
        return 0 if check(argv[2]) else 1
    print(__doc__, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
