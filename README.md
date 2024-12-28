# Tool hỗ trợ xếp lịch cho các đồng chí KMA

- Demo: [https://tin-chi-ngosangns.web.app](https://tin-chi-ngosangns.web.app/)

- Công cụ cần thiết:
  - Node.js
  - yarn: `npm i -g yarn`
  - ts-node: `npm i -g ts-node`

## Chạy dự án trên local

```sh
yarn
yarn start
```

## Cập nhật lịch

1. Clone repo về và chuẩn bị file excel tín chỉ của trường cấp.
2. Copy file excel vào đường dẫn `public/tinchi.xlsx` của project.
3. Chỉnh sửa biến `TITLE` và `SHEET_DATA` trong `src/configs/excel.ts`;
4. Chạy lệnh `yarn convert`.

## Deploy

1. Build project: `yarn; yarn build`
2. Upload code đã build trong thư mục `dist` lên hosting! :D
3. Nhớ để nguyên credit tác giả nhé!

---

Do mình hiện không còn hoạt động nhiều ở trường nên không có nhiều thời gian maintain cho dự án này do mục tiêu đầu tiên mình làm đó là phục vụ bản thân. Do đó nếu các bạn thấy tool hữu ích thì có thể đóng góp/cập nhật thời khóa biểu mỗi kì thông qua [merge request](https://github.com/ngosangns/tin-chi/pulls) hoặc có thể chủ động deploy lên hosting của các bạn nhé!

Cảm ơn các bạn đã ủng hộ sản phẩm!
