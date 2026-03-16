#!/usr/bin/env bash
# ============================================================
#  富途 OpenD + Python 依赖 一键安装脚本
#  适用于 Linux x86_64
#
#  使用方法:
#    chmod +x setup.sh && ./setup.sh
# ============================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ---- 配置 ----
OPEND_VERSION="9.0.5008"
OPEND_DIR="$HOME/FutuOpenD"
# 富途官方下载地址 (Ubuntu 版本)
OPEND_DOWNLOAD_URL="https://softwaredownload.futunn.com/Futu_OpenD_${OPEND_VERSION}_Ubuntu16.04.tar.gz"
# 备用：官方下载页面 https://www.futunn.com/en/download/OpenAPI
OPEND_TAR="Futu_OpenD_${OPEND_VERSION}.tar.gz"

# ---- 1. 安装 Python 依赖 ----
info "正在安装 Python 依赖..."
pip install futu-api pandas numpy tabulate 2>/dev/null || \
pip3 install futu-api pandas numpy tabulate || \
    error "pip 安装失败，请确保已安装 Python 3.8+"

info "Python 依赖安装完成 ✓"

# ---- 2. 下载 FutuOpenD ----
if [ -f "$OPEND_DIR/FutuOpenD" ]; then
    info "FutuOpenD 已存在于 $OPEND_DIR，跳过下载"
else
    info "正在下载 FutuOpenD v${OPEND_VERSION}..."
    mkdir -p "$OPEND_DIR"

    if command -v wget &>/dev/null; then
        wget -q --show-progress -O "/tmp/$OPEND_TAR" "$OPEND_DOWNLOAD_URL" || \
            warn "下载失败，可能需要手动下载（见下方说明）"
    elif command -v curl &>/dev/null; then
        curl -L --progress-bar -o "/tmp/$OPEND_TAR" "$OPEND_DOWNLOAD_URL" || \
            warn "下载失败，可能需要手动下载（见下方说明）"
    else
        error "未找到 wget 或 curl，请先安装其中之一"
    fi

    if [ -f "/tmp/$OPEND_TAR" ]; then
        info "正在解压到 $OPEND_DIR..."
        tar -xzf "/tmp/$OPEND_TAR" -C "$OPEND_DIR" --strip-components=1 2>/dev/null || \
        tar -xzf "/tmp/$OPEND_TAR" -C "$OPEND_DIR" 2>/dev/null || \
            warn "解压失败，请手动解压"
        rm -f "/tmp/$OPEND_TAR"
        chmod +x "$OPEND_DIR/FutuOpenD" 2>/dev/null || true
        info "FutuOpenD 安装完成 ✓"
    else
        warn "FutuOpenD 下载文件不存在"
    fi
fi

# ---- 3. 生成配置文件模板 ----
OPEND_CFG="$OPEND_DIR/FutuOpenD.xml"
if [ ! -f "$OPEND_CFG" ]; then
    info "正在生成 FutuOpenD 配置模板..."
    cat > "$OPEND_CFG" << 'XMLEOF'
<?xml version="1.0" encoding="utf-8"?>
<FutuOpenD>
    <!-- 登录账号 (填写你的富途牛牛登录手机号或邮箱) -->
    <login_account></login_account>
    <!-- 登录密码的 MD5 值 (可用 echo -n "你的密码" | md5sum 生成) -->
    <login_pwd_md5></login_pwd_md5>
    <!-- API 监听端口 -->
    <api_port>11111</api_port>
    <!-- 日志级别 -->
    <log_level>no</log_level>
</FutuOpenD>
XMLEOF
    info "配置模板已生成: $OPEND_CFG"
fi

# ---- 4. 生成启动脚本 ----
START_SCRIPT="$OPEND_DIR/start.sh"
cat > "$START_SCRIPT" << SHEOF
#!/usr/bin/env bash
cd "$OPEND_DIR"
echo "正在启动 FutuOpenD..."
echo "API 端口: 11111"
echo "按 Ctrl+C 停止"
echo "---"
./FutuOpenD
SHEOF
chmod +x "$START_SCRIPT"

# ---- 完成 ----
echo ""
echo "============================================================"
info "安装完成！"
echo "============================================================"
echo ""
echo "接下来请按以下步骤操作:"
echo ""
echo "  1. 编辑配置文件，填入富途账号信息:"
echo "     vi $OPEND_CFG"
echo ""
echo "     - login_account: 你的富途登录手机号/邮箱"
echo "     - login_pwd_md5:  密码的 MD5 值"
echo "       生成方法: echo -n \"你的密码\" | md5sum"
echo ""
echo "  2. 启动 FutuOpenD:"
echo "     $START_SCRIPT"
echo ""
echo "  3. 运行交易分析:"
echo "     cd $(dirname "$0")"
echo "     python -m futu_analyzer.main"
echo ""
echo "  如果自动下载失败，请手动下载:"
echo "  官方下载页: https://www.futunn.com/en/download/OpenAPI"
echo "  直接链接:   https://softwaredownload.futunn.com/Futu_OpenD_${OPEND_VERSION}_Ubuntu16.04.tar.gz"
echo "  解压到 $OPEND_DIR 目录即可"
echo ""
