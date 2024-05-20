"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
require("./App.css");
const react_1 = require("react");
function App() {
    const [data, setData] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        fetch('/api?' + new URLSearchParams({
            foo: 'Kiana',
            bar: 'Gallagher'
        }))
            .then((res) => res.json())
            .then((data) => setData(data.message));
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { children: [" ", data, " "] }));
}
exports.default = App;
