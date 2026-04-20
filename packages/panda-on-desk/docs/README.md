<!-- Input: 开发者查阅子包文档 / Output: 子包 docs/ 内容索引 / Pos: panda-on-desk 子包文档目录（GitHub Pages 站点 source） -->

# panda-on-desk · docs

> 本目录同时是 **GitHub Pages 站点 source**（W10-T4）→ 公网访问：[https://lc2panda.github.io/panda/](https://lc2panda.github.io/panda/)
> CI workflow：`.github/workflows/docs.yml`（push to main 改 docs/* 或 *.md 自动部署）
> 本目录已通过 `.gitignore` negation `!packages/panda-on-desk/docs/**` 入库。

| 文件 | 地位 | 功能 |
|---|---|---|
| `index.md` | GitHub Pages 主页 | 文档总入口（README / CHANGELOG / CONTRIBUTING / ARCHITECTURE / PRIVACY / FAQ 索引） |
| `_config.yml` | Jekyll 站点配置 | title / baseurl / theme / 排除规则（GitHub Pages safe mode） |
| `INSTALL_TEST.md` | W9-T2 安装实测产物 | 新用户 walkthrough + 5+ 类常见报错排查 |
| `mac-build.md` | W20-T1 macOS 打包指引 | 三条路径（CI / 本地无签名 / 本地签名+公证） + CSC env 配置 + FAQ |
| `.nojekyll-marker` | 占位标记 | 切换到纯 markdown 时改名为 `.nojekyll` |

> 一旦目录结构变化（新文档 / 新格式），请同步更新本文 + `index.md` + `_config.yml`。
