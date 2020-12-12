import Bank from "./bank";
import Thief from "./thief";

async function main() {
  const bank = new Bank()
  const thief = new Thief(bank)

  const bills = await thief.steal(12)
  // const bills = await thief.steal(12, '202001')

  for (const bs of thief.groupByCard(bills)) {
    thief.putIntoExcel(bs)
    thief.putIntoWiz(bs)
  }
}

main().then(() => {
  console.log('done');
}).catch((err) => {
  console.log('err: ', err);
})
