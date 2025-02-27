import ThreeManager from "./ThreeManager.js";

export default class Main {
    constructor() {
        console.log("hello hello world")
        var threeMng = new ThreeManager();
        this._threeMng = threeMng;
        this._threeMng.start();
    }
}