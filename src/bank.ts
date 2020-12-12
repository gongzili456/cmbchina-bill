import Axios from "axios";
import { stringify } from "qs";
import { config } from "dotenv";
import { assert } from "console";
config()

export default class Bank {
  private host = "https://mobile.cmbchina.com"

  // 替换下面两个变量的值
  private userAgent = process.env.USER_AGENT
  private cookie = process.env.COOKIE
  private ClientNo = process.env.CLIENT_NO
  private CardNo = "" // 为 null 则是所有卡片

  constructor() {
    assert(process.env.COOKIE || process.env.CLIENT_NO, "无效的配置文件")
  }

  async bill(month: string, isFirst: boolean = true): Promise<Array<TransactionRecord>> {
    const data = stringify({
      "$RequestMode$": 1,
      CardNo: this.CardNo,
      IsFirstVisit: isFirst ? "Y" : undefined,
      DateMonth: month, // "202012"
      ClientNo: this.ClientNo,
      Command: isFirst ? "QUERYTRXINFOLIST" : "QUERYTRXLIST"
    })

    const resp = await this.poster<BillResponse>(`${this.host}/DTransaction/AccountBill/AB_GeneralBill.aspx`, data)
    const { $SysResult$: { $Content$: { LastTrxMonth, MoreTrxData, transactionList: { TransactionRecord } } } } = resp

    if (MoreTrxData !== "Y" || LastTrxMonth !== month) {
      return TransactionRecord
    }

    const next = await this.bill(LastTrxMonth, false)
    return TransactionRecord.concat(next)
  }

  private async poster<T>(url: string, data: any): Promise<T> {
    const resp = await Axios.post<T>(url, data, { headers: this.headers() })
    return resp.data
  }

  headers() {
    return {
      Host: "mobile.cmbchina.com",
      "X-Requested-With": "XMLHttpRequest",
      "Accept-Language": "zh-cn",
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Origin: "https://mobile.cmbchina.com",
      "User-Agent": this.userAgent,
      Referer: `https://mobile.cmbchina.com/DTransaction/AccountBill/AB_GeneralBill.aspx?DeviceType=D&ClientNo=${this.ClientNo}&version=9.0.0&behavior_entryid=myp002003`,
      Cookie: this.cookie,
    }
  }
}

interface BillResponse {
  "$SysResult$": {
    "$Content$": BillContent
    "$SysCode$": number
  }
}

interface BillContent {
  monthSummaryList: any
  transactionList: {
    TransactionRecord: Array<TransactionRecord>
  }
  transactionByDateList: any
  transactionByMonthList: any
  ErrCode: string // "Success"
  UPD_FLG: string // "N"
  LastTrxDate: string // "6.9"
  LastTrxMonth: string // "202006"
  MoreTrxData: string // "Y"
  TransNum: string // "50"
  SelectedCardType: string // "D"
  GeneralBillQ20Q40type: string // "Q20"
}

export interface TransactionRecord {
  TrxLevel1: string // "11"
  TrxLevel2: string // "1106"
  TrxLevel3: string // "A"
  TrxLevel2Desc: string //  "出行"
  CardType: string // "C"
  TrxFlag: string //  "B"
  TrxAmount: string // " - 27.05"
  TrxAmount400: string // " - 27.05"
  CurrencyCode: string //  "10"
  TrxDes: string //  "滴滴出行"
  TrxNo: string // "50061820016673344XXX"
  TrxTime: string //  "2020 - 06 - 29 20: 45: 26"
  DetailType: string // "02"
  SelfTrxFlag: string // "N"
  EnterAcountFlag: string // "N"
  RtFlag: string // "B"
  DisplayCard: string // "出行 信用卡XXXX 20: 45"
  DateMonth: string //  "202006"
  DisplayAmout: string // " -￥27.05"
  DB1Code: string // "045"
  PicFlag: string // "N"
  AmountLength: number // 7
  TrxDate: string // "6.29"
  BalanceAmount: string // "0.00"
  DataDate: string // "2020 - 06 - 30"
  TrxMonth: string // "202006"
  NotModifyFlag: boolean // false
  HaveModifyFlag: boolean // false
  DisplayCardHalf: string // " 信用卡XXXX 20: 45"
  RMB_AMT: string // " - 27.05"
  QUA_COD: string // ""
  MCH2_DES: string //  "支付宝 - 北京嘀嘀无限科技发展有限公司"
  EncryCardNo: string // "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  OherCardName: string // "他行卡"
  CurrencySymbol: string // "￥"
  IsCustomTrans: string // "N"
  UserDes: string // ""
  EncryEacId: string // "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  CreditTransType: string // "消费"
  TrxTimeNew: string // "2020 - 06 - 29 20: 45: 26"
}