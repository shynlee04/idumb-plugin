# iDumb - Quản trị Phân cấp cho OpenCode

> **Ủy quyền Thông minh với Ranh giới được Quản lý**

iDumb là framework quản trị AI phân cấp đảm bảo phát triển code an toàn, được kiểm soát và có hệ thống thông qua ủy quyền agent và quản lý quyền hạn.

## 🚀 Bắt đầu Nhanh

```bash
# Clone repository
git clone https://github.com/shynlee04/idumb-plugin.git
cd idumb-plugin

# Cài đặt cho dự án của bạn (chạy từ thư mục dự án)
node /path/to/idumb-plugin/bin/install.js --local

# Hoặc cài đặt toàn cục
node /path/to/idumb-plugin/bin/install.js --global
```

> **Lưu ý**: Package chưa được publish lên npm. Cài đặt từ source.

## 🎯 Tính năng Chính

### Hệ thống Agent Phân cấp
- **Supreme Coordinator**: Lập kế hoạch, ủy quyền, không bao giờ thực thi
- **High Governance**: Xác thực, điều phối các agent con
- **Low Validator**: Xác minh chỉ đọc (grep, glob, tests)
- **Builder**: Agent DUY NHẤT có thể ghi file

### Cấp độ Kinh nghiệm
| Cấp độ | Mô tả |
|--------|-------|
| **pro** | Người dùng điều khiển, AI gợi ý. Ít rào cản. |
| **guided** | AI giải thích lý do, xác nhận trước hành động. (Mặc định) |
| **strict** | Rào cản không thương lượng, chặn hành động không an toàn. |

### Hỗ trợ Ngôn ngữ
Cấu hình ngôn ngữ giao tiếp và tài liệu riêng biệt:
```
/idumb:config language communication vi  # AI nói tiếng Việt
/idumb:config language documents en       # Tài liệu bằng tiếng Anh
```

## 📁 Cấu trúc Dự án

```
.idumb/
├── config.json          # Cấu hình chính (NGUỒN SỰ THẬT DUY NHẤT)
├── brain/
│   ├── state.json       # Trạng thái quản trị hiện tại
│   ├── history/         # Lịch sử hành động
│   └── context/         # Context được bảo tồn
├── governance/
│   └── validations/     # Báo cáo xác thực
├── anchors/             # Quyết định quan trọng sống sót qua compaction
└── sessions/            # Metadata phiên

.opencode/
├── agents/idumb-*.md    # Profile agent
├── commands/idumb/*.md  # Lệnh
├── tools/idumb-*.ts     # Công cụ
└── plugins/idumb-core.ts # Event hooks
```

## 🔧 Các Lệnh

| Lệnh | Mô tả |
|------|-------|
| `/idumb:init` | Khởi tạo iDumb trong dự án |
| `/idumb:status` | Hiển thị trạng thái quản trị |
| `/idumb:config` | Xem/sửa cấu hình |
| `/idumb:validate` | Chạy tất cả kiểm tra xác thực |
| `/idumb:help` | Hiển thị trợ giúp |

## ⚡ Quy tắc Phân cấp

```
Milestone → Phase → Plan → Task
     ↓
coordinator → governance → validator → builder
```

**Chuỗi Không Được Phá Vỡ:**
- Coordinator ủy quyền, không bao giờ thực thi
- Chỉ builder mới có thể ghi file
- Mọi hành động đều được ghi log và có thể truy vết

## 📝 Giấy phép

MIT

## 🌐 Tài liệu

- [English Documentation](./docs/en/README.md)
- [Tài liệu tiếng Việt](./docs/vi/README.md)
