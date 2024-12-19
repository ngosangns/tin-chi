# Tool hỗ trợ xếp lịch cho các đồng chí KMA

- Demo: [https://tin-chi-ngosangns.web.app](https://tin-chi-ngosangns.web.app/)

- Công cụ cần thiết:
  - Node.js
  - yarn: `npm i -g yarn`

## Hướng dẫn tự deploy tool và cập nhật lịch

1. Clone repo về và chuẩn bị file excel tín chỉ của trường cấp.
2. Làm theo các bước trong [video hướng dẫn này](https://www.youtube.com/watch?v=rQEv9uwFc18).
3. Copy file excel vào đường dẫn `public/tinchi.xlsx` của project và đổi tên theo định dạng như các file excel khác để người xem có thể download file excel tín chỉ về xem.
4. Build project: `pnpm install; pnpm build`
5. Up code đã build trong thư mục `dist` lên một hosting nào đó và xếp lịch thôi! :D
6. Nhớ để nguyên credit tác giả nhé!

**UPDATE:**

- Bản update mới không cần làm bước **thêm tiết lý thuyết vào tiết thực hành** như trong video hướng dẫn nữa nhé!
- Bản update mới thay file `mon.js` thành file mới ở đường dẫn `public/tinchi.json` nhé! Format mới sẽ như sau:

```json
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
        // ...
    ]
}
```

**ĐÓNG GÓP THỜI KHÓA BIỂU MỚI CHO DỰ ÁN:**

Do mình hiện không còn hoạt động nhiều ở trường nên không có nhiều thời gian maintain cho dự án này do mục tiêu đầu tiên mình làm đó là phục vụ bản thân. Do đó nếu các bạn thấy tool hữu ích thì có thể đóng góp/cập nhật thời khóa biểu mỗi kì nhé! Có 2 cách đóng góp:

1. Clone dự án về, cập nhật các file thời khóa biểu và up lên hosting khác sử dụng.
2. Hoặc bằng cách đơn giản hơn:
    - Fork dự án này về account Github của các bạn.
    - Trong trang web repository mà các bạn vừa fork về, nhấn dấu chấm (.). Github sẽ redirect sang VSCode web version chứa sẵn repository đó.
    - Cập nhật nội dung file `public/tinchi.json` và `public/tinchi.xlsx`.
    - Commit thay đổi.
    - Vào link <https://github.com/ngosangns/tin-chi/compare> và tạo pull request.
    - Khi active mình sẽ review và merge thay đổi.
    - Sau khi pull request đã được merge, các bạn vào link <https://tin-chi-ngosangns.web.app> sẽ thấy nội dung đã được cập nhật.

---

Cảm ơn các bạn đã ủng hộ sản phẩm!
