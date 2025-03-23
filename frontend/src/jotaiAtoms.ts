import { atom } from "jotai";
import { Tab } from "./components/sidebar/Tabs";

export const selectedTabAtom = atom<Tab>({ type: "collapsed" });
