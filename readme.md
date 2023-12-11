## Tool hỗ trợ xếp lịch cho các đồng chí KMA

Thông báo: Hiện nay tool đã được gộp vào dự án KIT Manager của Câu lạc bộ lập trình Học viện Kỹ thuật mật mã. Các bạn có
thể follow dự án KIT Manager ở đây: [https://github.com/KIT-Club/kit-manager](https://github.com/KIT-Club/kit-manager).

- Demo:
    - [https://tin-chi-ngosangns.web.app](https://tin-chi-ngosangns.web.app/)
    - [https://kit.id.vn/tinchi](https://kit.id.vn/tinchi/)

- Công cụ cần thiết:
    - Node.js
    - npm
    - pnpm

### Hướng dẫn tự deploy tool và cập nhật lịch

1. Clone repo về và chuẩn bị file excel tín chỉ của trường cấp.
2. Làm theo các bước trong [video hướng dẫn này](https://www.youtube.com/watch?v=rQEv9uwFc18).
3. Copy file excel vào đường dẫn `public/tinchi.xlsx` của project và đổi tên theo định dạng như các file excel khác để
   người xem có thể download file excel tín chỉ về xem.
5. Build project:

```
pnpm install
pnpm build
```

8. Up code đã build trong thư mục `dist` lên một hosting nào đó và xếp lịch thôi! :D
9. Nhớ để nguyên credit tác giả nhé :)

**UPDATE:**

- Bản update mới không cần làm bước **thêm tiết lý thuyết vào tiết thực hành** như trong video hướng dẫn nữa nhé!
- Bản update mới thay file `mon.js` thành file mới ở đường dẫn `public/tinchi.json` nhé! Format mới sẽ như sau:

```
{
    "title": "Học kỳ n năm học 20xx - 20xx",
    "data": [
        [
            "Chủ nghĩa xã hội khoa học-2-21 (A18C6D501)",
            4,
            "06/06/22",
            "10/07/22",
            "1->3"
        ],
        [
            "Chủ nghĩa xã hội khoa học-2-21 (A18C6D501)",
            6,
            "06/06/22",
            "10/07/22",
            "1->3"
        ],
        ...
    ]
}
```
