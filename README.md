# Tool hỗ trợ xếp lịch cho các đồng chí KMA

- Demo: [https://tin-chi-ngosangns.web.app](https://tin-chi-ngosangns.web.app/)

- Công cụ cần thiết:
  - Node.js
  - yarn: `npm i -g yarn`

## Chạy dự án trên local

```sh
yarn
yarn start
```

## Cập nhật lịch

1. Clone repo về và chuẩn bị file excel tín chỉ của trường cấp.
2. Làm theo các bước trong [video hướng dẫn này](https://www.youtube.com/watch?v=rQEv9uwFc18) (Hiện các bạn không cần phải làm bước **thêm tiết lý thuyết vào tiết thực hành** trong video hướng dẫn nữa nhé!).
3. Copy file excel vào đường dẫn `public/tinchi.xlsx` của project.
4. Format file JSON theo định dạng dưới đây và copy file JSON vào đường dẫn `public/tinchi.json` của project.

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

## Deploy

1. Build project: `pnpm install; pnpm build`
2. Upload code đã build trong thư mục `dist` lên hosting! :D
3. Nhớ để nguyên credit tác giả nhé!

---

Do mình hiện không còn hoạt động nhiều ở trường nên không có nhiều thời gian maintain cho dự án này do mục tiêu đầu tiên mình làm đó là phục vụ bản thân. Do đó nếu các bạn thấy tool hữu ích thì có thể đóng góp/cập nhật thời khóa biểu mỗi kì thông qua [merge request](https://github.com/ngosangns/tin-chi/pulls) hoặc có thể chủ động deploy lên hosting của các bạn nhé!

Cảm ơn các bạn đã ủng hộ sản phẩm!
