---
name: huong-sac-son-video
description: "Xử lý video KOL cho kênh Hường Sắc Son — ghép 2 clip Flow 8s thành video 16s hoàn chỉnh: color grade, hiệu ứng chuyển cảnh, transcribe giọng nói tiếng Việt bằng Whisper, burn subtitle đồng bộ giọng nói, thanh hồng thương hiệu, ảnh bìa chìm. USE WHEN user nói 'ghép video', 'làm video Thu Hường', 'burn subtitle', 'ảnh bìa video', 'transcribe giọng nói', 'huong-sac-son-video', 'làm video Hường Sắc Son', 'xử lý clip Flow'."
framework: "ffmpeg + Whisper (ggml-small.bin) — Flow clips → merge → transcribe → subtitle → cover frame"
---

# Hường Sắc Son — Video Processing Skill

Skill này nhận **2 clip MP4 từ Google Flow (mỗi clip 8s)** và xuất ra **1 video 16s hoàn chỉnh** sẵn sàng đăng TikTok / Reels / YouTube Shorts.

---

## Thông tin thương hiệu cố định

| Thứ | Giá trị |
|---|---|
| **Tên kênh** | Hường Sắc Son |
| **Sản phẩm** | Son C'Choi + Nhân Sâm Táo Đỏ CND Ginseng (Droppii affiliate) |
| **Tệp khách** | Phụ nữ 25–45 tuổi |
| **Màu brand** | Hồng đậm `#FF6B35` (son cam), hồng nhạt `#FFAACC` |
| **Font tiêu đề** | Comic Sans MS Bold — viền trắng dày |
| **Font phụ đề** | Georgia Italic |
| **Màu chữ brand** | Son Cam `#FF6B35` → ASS: `&H00356BFF` |

---

## Cấu trúc video chuẩn

```
[0.0 – 1.5s]  Ảnh bìa tĩnh (thumbnail chìm)
[1.5 – 9.5s]  Cảnh 1 — chân dung nói chuyện (8s)
[9.5 – 0.5s]  Chuyển cảnh circleopen (0.5s)
[10.0 – 17.5s] Cảnh 2 — cầm sản phẩm (8s)
```

---

## Workflow 5 bước

### Bước 1 — Nhận clip từ user
User gửi 2 đường dẫn file MP4 (Cảnh 1 + Cảnh 2) từ Google Flow.

### Bước 2 — Render video + subtitle

**Tạo filter script** `filter_video.txt`:

```
[0:v]eq=saturation=1.15:contrast=1.05:brightness=0.02,setpts=PTS-STARTPTS[v0];
[1:v]eq=saturation=1.15:contrast=1.05:brightness=0.02,setpts=PTS-STARTPTS[v1];
[v0][v1]xfade=transition=circleopen:duration=0.5:offset=7.5[vx];
[vx]drawbox=x=0:y=52:w=iw:h=72:color=0xFF85B0@0.82:t=fill:enable='between(t,0,15.9)'[vb1];
[vb1]drawbox=x=0:y=1045:w=iw:h=130:color=0xFFAACC@0.80:t=fill:enable='between(t,START,END)'[vb2];
[vb2]ass=filename='C\:/Users/Admin/[tenfile].ass'[vout];
[0:a][1:a]acrossfade=d=0.5[aout]
```

**Lệnh render:**
```powershell
ffmpeg -y -i $v1 -i $v2 "-/filter_complex" "filter_video.txt" `
  -map "[vout]" -map "[aout]" `
  -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p `
  -c:a aac -ar 48000 `
  $temp_output
```

⚠️ **Luôn có `-pix_fmt yuv420p`** — thiếu cờ này libx264 có thể tự chọn `yuv444p` (profile High 4:4:4 Predictive) do filter `ass`/`drawbox` có alpha, khiến video KHÔNG mở được trên Windows/điện thoại/TikTok dù ffprobe vẫn đọc file bình thường. Xem bảng lỗi thường gặp bên dưới.

### Bước 3 — Transcribe giọng nói bằng Whisper

```powershell
# Extract audio
ffmpeg -y -i $temp_output -ar 16000 -ac 1 -f wav audio.wav

# Transcribe (model tại C:\Users\Admin\ws.bin)
$filter = "whisper=model='C\:/Users/Admin/ws.bin':language=vi:format=srt:destination='C\:/path/transcript.srt'"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($filter)
[System.IO.File]::WriteAllBytes("wfilter.txt", $bytes)

ffmpeg -y -i audio.wav "-/af" "wfilter.txt" -f null -
```

### Bước 4 — Tạo ASS subtitle từ transcript

**Template ASS file** (`tenfile.ass`) — lưu tại `C:\Users\Admin\n1.ass` (path ngắn để tránh lỗi ffmpeg):

```ass
[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,Georgia,58,&H00FFFFFF,&H000000FF,&H00993366,&H00000000,-1,0,0,0,100,100,2,0,1,2.5,1.5,5,40,40,180,1
Style: Brand,Comic Sans MS,48,&H00356BFF,&H00FFFFFF,&H00FFFFFF,&H00000000,-1,0,0,0,100,100,1,0,1,4,1,8,0,0,0,1
Style: Sub,Georgia,30,&H00FFFFFF,&H000000FF,&H00AA6688,&H00000000,0,1,0,0,100,100,0.5,0,1,1.5,0,8,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Hook,,0,0,0,,{\an5\pos(360,880)\fad(200,300)}[HOOK TITLE LINE 1]\N[HOOK TITLE LINE 2]
Dialogue: 0,0:00:00.10,0:00:15.90,Brand,,0,0,0,,{\an8\pos(360,66)}Hường Sắc Son
Dialogue: 0,0:00:START,0:00:END,Sub,,0,0,0,,{\an8\pos(360,1067)}[Dòng 1 từ transcript]
Dialogue: 0,0:00:START,0:00:END,Sub,,0,0,0,,{\an8\pos(360,1112)}[Dòng 2 từ transcript]
```

**Quy tắc vị trí subtitle:**
- Thanh hồng trên: `y=52, h=72` → chữ Brand tại `\pos(360,66)`
- Thanh hồng dưới: `y=1045, h=130` → dòng 1 tại `\pos(360,1067)`, dòng 2 tại `\pos(360,1112)`

**Lưu ASS không có BOM:**
```powershell
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
[System.IO.File]::WriteAllBytes("C:\Users\Admin\n1.ass", $bytes)
```

### Bước 5 — Ghép thumbnail + xuất file cuối

```powershell
# Chụp thumbnail từ video đã render (giây 1.5)
ffmpeg -y -i $temp -ss 00:00:01.5 -frames:v 1 thumb.jpg

# Ghép thumbnail vào đầu (1.5s tĩnh) — -framerate 24 khớp video gốc, format=yuv420p ở 2 điểm để tránh lẫn yuv444p
ffmpeg -y -loop 1 -framerate 24 -t 1.5 -i thumb.jpg -i $temp `
  -filter_complex "[0:v]scale=720:1280,format=yuv420p[cover];[cover][1:v]concat=n=2:v=1:a=0,format=yuv420p[vout];[1:a]adelay=1500|1500[aout]" `
  -map "[vout]" -map "[aout]" `
  -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -profile:v high -level 4.1 -c:a aac -ar 48000 -movflags +faststart `
  $final_output
```

Sau khi render xong, LUÔN kiểm tra lại bằng:
```powershell
ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,profile,level -of default=noprint_wrappers=0 $final_output
```
Kết quả đúng phải là `pix_fmt=yuv420p`, `profile=High`, `level=41` (hoặc thấp hơn). Nếu thấy `yuv444p` / `High 4:4:4 Predictive` → video sẽ không mở được, phải render lại với `-pix_fmt yuv420p`.

---

## Quy tắc đặt tên file

| File | Tên |
|---|---|
| Video cuối (upload) | `huong-sac-son-[mã]-final.mp4` (vd: `huong-sac-son-S02-final.mp4`) |
| Thumbnail | `huong-sac-son-[mã]-thumb.jpg` |
| ASS subtitle | `C:\Users\Admin\n1.ass` (path ngắn cố định) |
| Filter script | `C:\Users\Admin\Desktop\Droppi\filter_video.txt` |
| Whisper model | `C:\Users\Admin\ws.bin` |

---

## Lỗi thường gặp & cách fix

| Lỗi | Nguyên nhân | Fix |
|---|---|---|
| `No option name near '/Windows/Fonts/...'` | Đường dẫn Windows có `:` bị parse nhầm | Dùng filter script file, path dùng `'C\:/...'` trong single quotes |
| `Unable to parse original_size` | Path ASS bị parse lỗi | Dùng `ass=filename='C\:/...'` với single quotes |
| Font lỗi dấu tiếng Việt | Font không hỗ trợ Unicode Vietnamese | Chỉ dùng Georgia / Comic Sans MS / Arial |
| Thumbnail màu cũ | Chụp thumb trước khi render xong | Luôn render video TRƯỚC, chụp thumb SAU |
| BOM error trong filter file | PowerShell ghi UTF-16 | Dùng `[System.IO.File]::WriteAllBytes()` |
| Video render xong nhưng KHÔNG MỞ ĐƯỢC (Windows/điện thoại/TikTok) dù ffprobe đọc bình thường | Thiếu `-pix_fmt yuv420p` → libx264 tự chọn `yuv444p` (High 4:4:4 Predictive), hầu hết decoder không hỗ trợ | Luôn thêm `-pix_fmt yuv420p` ở MỌI lệnh render (pass 1, pass 2, và bước concat thumbnail); dùng `format=yuv420p` trong filter_complex ở bước ghép thumbnail; verify lại bằng `ffprobe ... pix_fmt,profile,level` |
| Hook title che mặt nhân vật | `\pos(360,560)` nằm giữa khung hình, đúng vùng mặt | Dùng `\pos(360,880)` (vùng ngực/dưới cằm), cách xa thanh subtitle dưới (y=1045) |

---

## Caption 4 kênh — công thức genCaption

Hashtag base theo nhóm:
- **Son (S):** `#sonmoi #beautyvietnam #phunuviet #beautyreels`
- **Sức khoẻ (H):** `#suckhoe #phunuviet #healthreels`
- **Lifestyle (L):** `#lifestyle #phunuviet #beautyreels`
- **Bán hàng (B):** `#droppii #reviewthật #phunuviet`

| Kênh | Format |
|---|---|
| TikTok | `[Câu hook đầu tiên] 👇` + hashtag niche + 2 base tag |
| Instagram | Full cảnh 1 + cảnh 2 + `🌸 Link ở bio nha bạn!` + full hashtag |
| Facebook | Full cảnh 1 + cảnh 2 + `Chia sẻ cho ai cần nha 💕` |
| YouTube | `[Tiêu đề] — [hook đầu] \| Link ở bio` |
