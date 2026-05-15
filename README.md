# Gamefun

**XO Plus** là trò chơi dựa trên trò XO cơ bản trên trình duyệt, được xây dựng bằng TypeScript và HTML Canvas.

Dự án này là phiên bản phát triển tiếp từ mã nguồn của chủ sở hữu cũ, sau đó được chỉnh sửa và mở rộng thêm về giao diện, trải nghiệm chơi, chế độ chơi và các hiệu ứng tương tác để tạo thành phiên bản hiện tại.

## Chơi thử ngay

- [https://gamefun-262.pages.dev/](https://gamefun-262.pages.dev/)

## Điểm nổi bật

- Chơi với máy hoặc chơi 2 người trên cùng một thiết bị
- Giao diện được làm mới theo hướng hiện đại, trực quan hơn
- Có âm thanh, hiệu ứng chiến thắng và hiển thị điểm số
- Có thể đặt lại trận hoặc chơi tiếp nhiều ván liên tiếp

## Cách chơi

- Người chơi chọn một trong 7 cột để thả quân
- Quân cờ sẽ rơi xuống ô trống thấp nhất trong cột đó
- Người thắng là người nối được 4 quân liên tiếp theo hàng ngang, hàng dọc hoặc đường chéo

## Chạy local

1. Cài dependencies

```bash
yarn install
```

2. Chạy môi trường phát triển

```bash
yarn dev-browser
```

3. Mở game tại địa chỉ local do Vite cung cấp, thường là `http://127.0.0.1:5173/`

## Cấu trúc chính

- `browser/`: giao diện và trải nghiệm chơi trên trình duyệt
- `core/`: logic bàn cờ, luật chơi, AI
- `server/`: phần server của dự án

## Ghi nhận

Dự án hiện tại được phát triển dựa trên nền tảng từ phiên bản trước của chủ sở hữu cũ, và đã được tùy biến để phù hợp với định hướng sản phẩm `XO Plus`.

## License

Dự án tiếp tục sử dụng giấy phép MIT theo mã nguồn gốc.
