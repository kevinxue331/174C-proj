import ThreeManager from "./ThreeManager.js";

export default class Main {
    constructor() {
        var threeMng = new ThreeManager();
        this._threeMng = threeMng;
        this._threeMng.start();
    }
}



