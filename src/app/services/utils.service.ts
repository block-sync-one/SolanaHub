import { Injectable } from "@angular/core";
import { BehaviorSubject, filter, Observable } from "rxjs";
// import * as moment from "moment";
// import { v4 as uuidv4 } from "uuid";
declare global {
  interface Date {
    addDays(): Function;
  }
}
@Injectable({
  providedIn: "root",
})
export class UtilsService {
  constructor() {}
  private _systemPair = new BehaviorSubject<string>('USD' as string);
  public updateSystemPair(string): void{
    this._systemPair.next(string);
  }
  public addrUtil(addr: string): {addr: string, addrShort:string} {
    return {addr, addrShort: addr?.substring(0, 4) + '...' + addr.substring(addr.length - 4, addr.length[addr.length])}
  }
  public calcPair(){
    this._systemPair.value
  }
  public getBlockchainAssets(addr: string){
    let assets = {};
  }
  public fixedNum(number): number{
    return Number(number.toFixed(3))
  }
  isNotNull = <T>(source: Observable<T | null>) => source.pipe(filter((item: T | null): item is T => item !== null));
  // generateUUID() {
  //   return uuidv4();
  // }
  // mmddFormat(date): string {
  //   return moment(date, "DD/MM/YYYY").format("MM/DD/YYYY");
  // }
  // dynamicFormat(date: any, format: string): string {
  //   return moment(date).format(format);
  // }
  // // return the distance between given and current dates
  // dateDiff(date, by: "days" | "month"): number {
  //   return moment(date).diff(moment(), by);
  // }
  // // for chat use
  // timeStamp(unixTime): string {
  //   let timeToMS = unixTime / Number("10000000");
  //   return (
  //     moment.unix(timeToMS).format("HH:mm") +
  //     " " +
  //     moment.unix(timeToMS).format("DD/MM/YYYY")
  //   );
  // }
  // // return custom date
  // dynamicDate(date: Date, number: number, by: "days" | "month"): string {
  //   return moment(date).add(number, by).toString();
  // }
}