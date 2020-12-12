## 一撇
年底了，看看你的钱去哪了吧~

这个项目的作用就是将招商银行的账单导出刀 Excel 中，方便做多元分析。其次还有一个附加功能是为 MoneyWiz 用户提供的可以直接导入到 MoneyWiz 的 svc 文件。

## 使用步骤
### 抓包
抓包的目的是拿到招商银行 APP 的用户鉴权信息。
- 这里要分析的目标接口是招商银行 APP 中『我的』页面中的『收支明细』页面。
- 需要两个变量的值是：`ClientNo、Cookie 与 User-Agent`
- 在你的抓包工具中找到目标的 URL(https://mobile.cmbchina.com/DTransaction/AccountBill/AB_GeneralBill.aspx)，并在 `Request` 中的 `Body` 位置找到字段 `ClientNo`，在 `Header` 位置找到 `Cookie` 和 `User-Agent`。

### 配置文件
将抓包得来的两个变量值放置到 `.env` 文件中

### 执行
在 `src/index.ts` 文件中找到下面代码行，并稍作修改。
```
// 默认从从前月份向前抓取指定月数的账单
const bills = await thief.steal(12)

// 也可以指定具体的开始月份
const bills = await thief.steal(12, '202001')
```

```
// 在命令行执行
$ npx ts-node src/index.ts
```
### 查看结果
结果有两种：
  - Excel 文件放在了 `src/bills` 
  - 可供导入 MoneyWiz 的 svc 文件放在了 `src/wiz`

## TODO
- 美团
- 饿了么
- 滴滴