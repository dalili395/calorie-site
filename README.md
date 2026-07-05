# 热量计算网站本地版

直接打开 `index.html` 即可使用。

也可以用 VS Code 打开整个 `D:\Codex Project\calorie-site` 文件夹，或者双击 `calorie-site.code-workspace` 打开工作区。

当前版本包含：

- 食物搜索
- 按克数计算热量
- 独立的 `js/data/foods.js` 本地食物库，目前 504 项
- 搜索框下方的分类食物库，可点击食物自动填入搜索框
- 搜索时自动切换到匹配食物所在分类，并高亮匹配项
- 今日计划模块，可设置目标热量并添加早餐、午餐、晚餐、宵夜
- 总热量实时可视化，超过目标后显示超标提醒
- 支持按克、毫升、个、只、片、块、根、碗、杯、份等单位计算
- `js/services/portionService.js` 集中维护常见食物份量换算规则
- 本地美食横幅图片资产
- 简洁用户界面

项目结构：

- `index.html`：页面入口
- `styles.css`：页面样式
- `js/app.js`：应用装配入口
- `js/data/foods.js`：食物热量数据
- `js/data/categories.js`：分类配置和分类规则
- `js/services/foodSearch.js`：搜索和分类服务
- `js/services/portionService.js`：单位和份量换算服务
- `js/controllers/calculatorController.js`：热量计算控制
- `js/controllers/libraryController.js`：食物库展示控制
- `js/controllers/plannerController.js`：今日计划控制
- `js/controllers/moduleNavigationController.js`：模块入口跳转控制
- `js/utils/format.js`：格式化工具
- `assets/food-hero.png`：页面美食横幅图片

本地预览方式：

1. 直接双击 `index.html`。
2. 在 VS Code 里安装 Live Server 后，右键 `index.html`，选择 Open with Live Server。
3. 在 VS Code 终端任务里运行“打开本地页面”。

后续接入方案：

1. 后端同步 USDA FoodData Central API 或下载包。
2. 写入自己的缓存数据库。
3. 定时任务按周或按月更新。
4. 前端只读取缓存数据，并展示来源和版本。
