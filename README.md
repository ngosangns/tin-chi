## Tool hỗ trợ xếp lịch cho các đồng chí KMA

- Demo: [https://tin-chi-ngosangns.web.app](https://tin-chi-ngosangns.web.app/)

- Công cụ cần thiết:
  - Node.js
  - npm
  - pnpm

### Hướng dẫn tự deploy tool và cập nhật lịch

1. Clone repo về và chuẩn bị file excel tín chỉ của trường cấp.
2. Làm theo các bước trong [video hướng dẫn này](https://www.youtube.com/watch?v=rQEv9uwFc18).
   - _CHÚ Ý: Bản update mới không cần làm bước **thêm tiết lý thuyết vào tiết thực hành** như trong video hướng dẫn nữa nhé!_
   - _CHÚ Ý: Bản update mới thay file `mon.js` thành `src/lib/js/data.ts` nhé!_
3. Copy file excel vào thư mục `static/calendar-excel` của project và đổi tên theo định dạng như các file excel khác để người xem có thể download file excel tín chỉ về xem.
4. Cập nhật lại thông tin download excel và tiêu đề trong file `src/routes/+page.svelte`
5. Build project:

```
pnpm install
pnpm build
```

8. Up code đã build trong thư mục `build` lên một hosting nào đó và xếp lịch thôi! :D
9. Nhớ để nguyên credit tác giả nhé :)
