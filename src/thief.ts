import { appendFileSync } from "fs";
import { groupBy, pick, trim, uniqBy } from "lodash";
import moment from "moment";
import { join } from "path";
import * as XLSX from 'xlsx';
import Bank, { TransactionRecord } from "./bank";

export default class Thief {
  private bank: Bank

  constructor(bank: Bank) {
    this.bank = bank
  }

  /**
   * 向银行偷取账单, 支持从某个时间开始（默认为当前月份）后的几个月
   * @param months 
   * @param startMonth 202012
   */
  async steal(months: number, startMonth?: string): Promise<Array<TransactionRecord>> {
    let bills: Array<TransactionRecord> = []

    for (let i = 0; i < months; i++) {
      const m = moment(startMonth).subtract(i, 'M').format('YYYYMM')
      const b = await this.bank.bill(m)
      bills = bills.concat(b)
      console.log('Result: ', m, b.length);
    }

    return uniqBy(bills, 'TrxNo')
  }

  groupByCard(trans: Array<TransactionRecord>) {
    return Object.values(groupBy(trans, "EncryCardNo"))
  }

  putIntoExcel(bills: Array<TransactionRecord>) {
    if (!bills || !bills.length) {
      console.error("No bills to Excel");
      return
    }

    const fileName = join(__dirname, 'bills', `${trim(bills[0].DisplayCardHalf).split(" ")[0]}.xlsx`)

    const data = bills.map((t: TransactionRecord) => pick(t, [
      'TrxNo', 'DataDate', 'TrxTimeNew', 'DisplayAmout', 'TrxAmount', 'BalanceAmount',
      'TrxDes', 'MCH2_DES', 'TrxLevel2Desc', 'DisplayCardHalf', 'EncryCardNo',
      'CreditTransType', 'IsCustomTrans', 'SelfTrxFlag',
      'TrxLevel1', 'TrxLevel2', 'TrxLevel3',
      'CardType', 'TrxFlag', 'DetailType', 'EnterAcountFlag', 'RtFlag', 'DateMonth',
      'DB1Code', 'PicFlag', 'TrxDate', 'NotModifyFlag', 'HaveModifyFlag', 'RMB_AMT',
      'UserDes',
    ]))

    const { writeFile, utils: { json_to_sheet, book_append_sheet, book_new } } = XLSX;

    /* make the worksheet */
    var ws = json_to_sheet(data);

    /* add to workbook */
    var wb = book_new();
    book_append_sheet(wb, ws, "Bills");

    /* write workbook */
    writeFile(wb, fileName)
  }

  putIntoWiz(bills: Array<TransactionRecord>) {
    if (!bills || !bills.length) {
      console.error("No bills to Wiz");
      return
    }
    const cardNo = trim(bills[0].DisplayCardHalf).split(" ")[0]
    const fileName = join(__dirname, 'wiz', `${cardNo}.csv`)

    appendFileSync(fileName, 'sep=,,,,,,,,,,,,\n')
    appendFileSync(fileName, '命名,当前余额,账户,转账,描述,交易对象,分类,日期,时间,金额,货币,支票号码,标签\n')
    appendFileSync(fileName, `${cardNo},0,CNY,,,,,,,,,,\n`)

    for (const c of bills) {
      const b: any = this.transToWiz(c)
      appendFileSync(fileName, `,,${b['账户']},${b['转账']},${b['描述']},${b['交易对象']},${b['分类']},${b['日期']},${b['时间']},${b['金额']},${b['货币']},${b['支票号码']},${b['标签']}\n`)
    }
  }

  private transToWiz(t: TransactionRecord) {
    return {
      "账户": t.EncryCardNo,
      "转账": "",
      "描述": "",
      "交易对象": t.TrxDes,
      "分类": t.TrxLevel2Desc,
      "日期": t.DataDate,
      "时间": t.DisplayCardHalf,
      "备忘": "",
      "金额": `"${t.TrxAmount}"`,
      "货币": "CNY",
      "支票号码": "",
      "标签": "",
    }
  }
}