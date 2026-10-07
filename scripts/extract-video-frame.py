#!/usr/bin/env python3
"""Extract a still image from a locally supplied video without changing the video."""
import argparse
import pathlib
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('video', type=pathlib.Path, help='Path to your local source video')
parser.add_argument('timestamp', help='Position as seconds or HH:MM:SS')
parser.add_argument('output', type=pathlib.Path, help='New PNG or JPG image file')
args = parser.parse_args()
args.video = args.video.resolve()
args.output = args.output.resolve()
if not args.video.is_file():
    parser.error('Source video does not exist.')
if args.output.suffix.lower() not in ('.png', '.jpg', '.jpeg'):
    parser.error('Use a PNG or JPG output filename.')
if args.output.exists():
    parser.error('Output already exists; choose another filename.')
try:
    parts = args.timestamp.split(':')
    if len(parts) > 3 or any(not part or float(part) < 0 for part in parts):
        raise ValueError
    seconds = sum(float(part) * 60 ** i for i, part in enumerate(reversed(parts)))
    if not 0 <= seconds <= 86400:
        raise ValueError
except ValueError:
    parser.error('Use seconds or HH:MM:SS between 0 and 24 hours.')
args.output.parent.mkdir(parents=True, exist_ok=True)
try:
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-n', '-ss', str(seconds),
                    '-i', str(args.video), '-frames:v', '1', str(args.output)], check=True)
except FileNotFoundError:
    parser.error('ffmpeg is required to extract a frame.')
if not args.output.is_file() or not args.output.stat().st_size:
    parser.error('No frame was found at that timestamp. Check the video duration.')
print(f'Saved {args.output}')
