---
slug: npm-tgz
title: "Why Does npm Ship Packages as tgz?"
date: 2026-09-16
tags: ["npm", "javascript"]
thumbnail: "/uploads/2026/09/npm-tgz.png"
draft: false
description: "Not zip, not 7z, but a format from 1979. Why bundling first and compressing second makes npm packages 23% smaller, and why sealing them into one file is what makes integrity hashes possible."
---

# Why Does npm Ship Packages as tgz?

---

Publishing a library to an in-house Nexus, you end up watching `npm publish` upload a single `.tgz`.

```bash
$ npm pack
my-lib-1.0.0.tgz
```

Not zip, not 7z — why tgz of all things? There are reasons a format from 1979 is still in use in 2026.

## tgz is not one format

`.tgz` is short for `.tar.gz`. It's **the result of passing through two tools**.

```
directory  →  tar  →  a single .tar file  →  gzip  →  .tgz
           (bundling)                     (compression)
```

`tar` **does not compress.** It only strings several files into one stream while preserving paths, permissions, and timestamps. `gzip` **does not bundle.** It only takes a single byte stream and makes it smaller.

That contrasts with zip, which does both at once. This separation is what produces the properties described below.

## tar — built to write to tape

The name itself is **T**ape **AR**chive. It first shipped in Seventh Edition UNIX in January 1979.

Back then the backup medium was magnetic tape. Tape has no file system. It's a device you read and write sequentially from the front, so several files had to be turned into **one continuous flow of bytes**. That's what tar did.

The format is simple. A 512-byte header (filename, permissions, size, timestamp) alternates with the file contents, and the end is blocks filled with zeros.

- **1988** POSIX.1 standardized it as `ustar`. It gained support for long filenames, symbolic links, and device files.
- **2001** POSIX.1-2001 added the `pax` format. It can carry extended metadata and is compatible with ustar.

The key point is that the standard has held for over 40 years. Any Unix-like system can read tar.

## gzip — built to dodge a patent

gzip was created in 1992 by Jean-loup Gailly and Mark Adler. 0.1 came out on October 31, 1992, and 1.0 in February 1993.

The reason it was made is interesting. The standard compression tool on Unix at the time was `compress`, and the **LZW algorithm it used was covered by Unisys and IBM patents**. Those patents didn't expire until 2003 and 2004 respectively.

So a non-infringing algorithm was needed, and that is **DEFLATE**. It combines LZ77 (replacing repeated byte sequences with back-references) with Huffman coding (assigning short bit patterns to frequent values).

The HTTP `Content-Encoding: gzip` we use today, PNG's internal compression, and zip's default compression method are all that same DEFLATE. Something built to dodge a patent became the standard.

## Why bundle first and compress second?

"Couldn't you just bundle while compressing?" you might think — but the order changes the result.

### The Unix philosophy

One tool does one job. That's what lets you combine them with pipes.

```bash
tar -cf - ./package | gzip -9 > package.tgz
tar -cf - ./package | xz    > package.txz   # just swap the compressor
```

If you want to change the compression method, you replace only the back end. tar doesn't need to be touched.

### Compression ratio — I measured it myself

This is the more practical reason. **Bundling first and compressing second lets you find duplication across file boundaries.**

I compared the two approaches on the `gray-matter@4.0.3` package (14 files, 38,621 bytes uncompressed).

```bash
# 1) bundle then compress — compress the single stream tar produced, whole
tar -cf - package | gzip -9 > solid.tgz

# 2) compress per file, then sum — the way zip does it
for f in $(find package -type f); do gzip -9 -c "$f" | wc -c; done
```

| Approach | Size |
|---|---|
| Bundle then compress (tar.gz) | **11,782 bytes** |
| Sum of per-file compression | 14,548 bytes |

A **23% difference**. JS files have lots of **patterns that overlap between files** — `require(`, `module.exports`, repeated variable names — and compressing per file relearns that duplication from scratch every time. String them into one and patterns seen in an earlier file get reused in a later one.

This is called **solid compression**. The more files there are, and the smaller they are, the bigger the difference.

### There's a cost too

It isn't free. Since the whole stream is compressed as one, **even pulling out a single file means decompressing from the front.**

## So why not just use zip?

zip bundles and compresses at once. You only need one tool, and on Windows it opens on a double click. So why doesn't npm use it?

### The compression method differs

zip **compresses each file separately** and appends a table of contents (the central directory) at the very end. The structure looks like this.

```
zip   : [compressed A][compressed B][compressed C][index]
tgz   : gzip( [A][B][C] )
```

zip can read the index and jump straight to the file you want. In exchange, compression restarts for every file, so it **can't exploit duplication between files.** That's where the 23% measured above comes from.

### Which is why their uses diverge

| | zip family | tar.gz family |
|---|---|---|
| Compression unit | Per file | Whole stream |
| Partial extraction | Possible (fast) | Must decompress from the front |
| Compression ratio | Lower | Higher |
| Typical cases | `.jar` `.apk` `.docx` `.epub` | npm packages, source distributions |

A `.jar` is read one class at a time, as the JVM needs them. A `.docx` may have only part of its XML read by a document viewer. They're **meant to be read in part**, so zip fits.

npm packages are the opposite. `npm install` **unpacks everything anyway.** Partial extraction isn't needed, so giving up that ability in exchange for compression ratio is the better trade. Considering the traffic a registry serves in a day, 23% is not small.

### They handle metadata differently too

tar was born on Unix, so it carries permissions, owner, and symbolic links **in the format itself**. zip was born on DOS, where no such concept existed, and bolted them on later as extra fields. As a result, Unix permissions stored in a zip may or may not survive depending on the tool.

That said, **npm actually doesn't use this ability.** Open a real tarball and you see this.

```bash
$ tar -tvzf rimraf-5.0.10.tgz | head -3
-rw-r--r-- 0/0   2085 1985-10-26 17:15 package/package.json
-rw-r--r-- 0/0    207 1985-10-26 17:15 package/dist/esm/bin.d.mts.map
-rw-r--r-- 0/0  15918 1985-10-26 17:15 package/dist/esm/bin.mjs.map
```

Permissions are all `644`, the owner is `0/0`, and **the timestamp is pinned to October 26, 1985**. npm does that on purpose. It picked that date because using the Unix epoch (1970) makes some zip tools behave oddly.

Why erase it? **Because the same source has to produce the same bytes.** If the time a file was created ends up in the tarball, something built yesterday and something built today hash differently. Then the integrity check in the next section doesn't hold.

In other words, npm uses tar not **to preserve metadata** but **to make one stream**. Executable permissions are applied at install time from the `bin` field in `package.json`, not from the tarball.

### To sum up

It's not that zip is bad — **the purpose is different.** What npm needs isn't "read parts of it quickly" but "make it small, download the whole thing, and verify it's identical byte for byte." tgz fits those conditions.

## Why npm uses this combination

### It can be read anywhere

A registry is ultimately a server handing out files over HTTP. tar+gzip can be handled by every Unix, every HTTP server, and the standard library of every language. That's why private registries like Nexus, Artifactory, and Verdaccio work without any special implementation.

npm doesn't even depend on the system `tar`. It uses [node-tar](https://github.com/isaacs/node-tar), a pure JS implementation. It behaves identically on Windows.

### A single hash guarantees integrity

A tgz is **one file, fixed byte for byte**. That's what makes it hashable.

Package metadata in the npm registry has a `dist` object, and it carries a checksum along with the tarball URL.

- `shasum` — the tarball's SHA-1
- `integrity` — since April 2017. The format is `<algorithm>-<base64 hash>` (these days mostly sha512)

It's that `integrity` value baked into `package-lock.json`.

```json
"gray-matter": {
  "version": "4.0.3",
  "resolved": "https://registry.npmjs.org/gray-matter/-/gray-matter-4.0.3.tgz",
  "integrity": "sha512-5v6yZd4J..."
}
```

That would be impossible if directories were uploaded as-is. If file order, timestamps, or permissions shift even slightly, there's no basis to decide "is this the same package." Because it's **sealed into one file**, you can say "this hash means exactly this content."

The pinned timestamp from earlier connects here. Running `npm pack` on the same source any number of times has to produce the same bytes for a hash to mean "the content is the same." This changed in npm v5.6.0.

### Immutability

Once published, a tgz doesn't change. You can't republish the same version, and the same URL gives the same bytes forever. It's the foundation of reproducible builds.

## Opening one up

`npm pack` pulls the tarball from the registry as-is.

```bash
$ npm pack gray-matter@4.0.3
gray-matter-4.0.3.tgz

$ tar -tzf gray-matter-4.0.3.tgz | head -5
package/LICENSE
package/lib/defaults.js
package/lib/engine.js
package/lib/engines.js
package/index.js
```

Every path **starts with `package/`.** Whatever the package is called, it's always `package/`. It's a convention so the side unpacking it doesn't need to know the name.

Looking at the first 4 bytes of the file confirms it's gzip.

```bash
$ xxd -l 4 gray-matter-4.0.3.tgz
00000000: 1f8b 0800
```

`1f 8b` is the gzip magic number, and `08` means the compression method is DEFLATE.

The sizes come out like this.

```
tar (before compression)  50,176 bytes
tgz (after compression)   11,775 bytes    →  about 4.3×
```

## Summary

- `.tgz` = `tar` (bundling) + `gzip` (compression). The result of **two different tools**.
- `tar` was built in 1979 for tape backup and became a POSIX standard in 1988.
- `gzip` was built in 1992 to dodge the LZW patent, and its DEFLATE became the web's standard compression.
- **Bundling first and compressing second** finds duplication across file boundaries and comes out smaller. The cost is giving up partial extraction.
- **zip made the opposite choice.** Compressing per file lets you pull out a part quickly, but loses compression ratio. It's a design suited to things read in part, like `.jar` and `.docx`.
- npm unpacks everything at install time anyway, so partial extraction isn't needed, and **sealing it into one file is what lets a hash guarantee integrity**.
- npm actually **erases** tar's metadata-preserving ability. It pins timestamps, permissions, and owner so that the same source always emits the same bytes.

Using a 40-year-old format isn't just inertia. The properties needed line up exactly.

## References

- [npm pack — npm Docs](https://docs.npmjs.com/cli/v11/commands/npm-pack)
- [npm registry — package metadata response format](https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md)
- [node-tar — the pure JS tar implementation npm uses](https://github.com/isaacs/node-tar)
- [tar (computing) — Wikipedia](https://en.wikipedia.org/wiki/Tar_(computing))
- [tar(5) man page — format details](https://man.archlinux.org/man/tar.5.en)
- [Gzip — Wikipedia](https://en.wikipedia.org/wiki/Gzip)
- [The gzip home page](http://www.gzip.org/)
- [RFC 1952 — GZIP file format specification](https://datatracker.ietf.org/doc/html/rfc1952)
- [RFC 1951 — DEFLATE compressed data format](https://datatracker.ietf.org/doc/html/rfc1951)
- [ZIP format — Wikipedia](https://en.wikipedia.org/wiki/ZIP_(file_format))
- [Normalize timestamps in `npm pack` tarballs — npm/npm#17412](https://github.com/npm/npm/issues/17412)
- [npm v5.6.0 release notes — ignore mtime when packing](https://blog.npmjs.org/post/167963735925/v560-2017-11-27)
- [Archive metadata — reproducible-builds.org](https://reproducible-builds.org/docs/archives/)
- [HOWTO: Inspect, Download and Extract NPM Packages](https://blog.packagecloud.io/how-to-inspect-download-and-extract-npm-packages/)
