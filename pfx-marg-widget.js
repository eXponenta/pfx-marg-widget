(function() {
  const widget_name = "Калькулятор маржи";
  const api = "https://quotes.instaforex.com/api/quotesTick?m=json&q=";
  const pairs = {
    ["Основные"]: [
      "EURUSD",
      "GBPUSD",
      "USDJPY",
      "USDCHF",
      "USDCAD",
      "USDRUB",
      "EURRUB",
      "AUDUSD",
      "NZDUSD"
    ],
    ["Кросс-курсы"]: [
      "EURJPY",
      "EURCHF",
      "EURGBP",
      "AUDCAD",
      "AUDCHF",
      "AUDJPY",
      "CADCHF",
      "CADJPY",
      "CHFJPY",
      "NZDCAD",
      "NZDCHF",
      "NZDJPY",
      "EURAUD",
      "GBPCHF",
      "GBPJPY",
      "AUDNZD",
      "EURCAD",
      "EURNZD",
      "GBPAUD",
      "GBPCAD",
      "GBPNZD",
      "USDDKK",
      "USDSEK",
      "USDNOK",
      "USDZAR",
      "AUDCZK",
      "AUDDKK",
      "AUDHKD",
      "AUDHUF",
      "AUDMXN",
      "AUDNOK",
      "AUDPLN",
      "AUDSEK",
      "AUDSGD",
      "AUDZAR",
      "CADCZK",
      "CADDKK",
      "CADHKD",
      "CADHUF",
      "CADMXN",
      "CADNOK",
      "CADPLN",
      "CADSEK",
      "CADSGD",
      "CADZAR",
      "CHFCZK",
      "CHFDKK",
      "CHFHKD",
      "CHFHUF",
      "CHFMXN",
      "CHFNOK",
      "CHFPLN",
      "CHFSEK",
      "CHFSGD",
      "CHFZAR",
      "EURCZK",
      "EURDKK",
      "EURHKD",
      "EURHUF",
      "EURMXN",
      "EURNOK",
      "EURPLN",
      "EURSEK",
      "EURSGD",
      "EURZAR",
      "GBPCZK",
      "GBPDKK",
      "GBPHKD",
      "GBPHUF",
      "GBPMXN",
      "GBPNOK",
      "GBPPLN",
      "GBPSEK",
      "GBPSGD",
      "GBPZAR",
      "NZDCZK",
      "NZDDKK",
      "NZDHKD",
      "NZDHUF",
      "NZDMXN",
      "NZDNOK",
      "NZDPLN",
      "NZDSEK",
      "NZDSGD",
      "NZDZAR",
      "USDCZK",
      "USDHKD",
      "USDHUF",
      "USDMXN",
      "USDPLN",
      "USDSGD",
      "CZKJPY",
      "DKKJPY",
      "HKDJPY",
      "HUFJPY",
      "MXNJPY",
      "NOKJPY",
      "SGDJPY",
      "SEKJPY",
      "ZARJPY",
      "USDMYR",
      "USDIDR",
      "USDBGN",
      "USDAED",
      "USDPHP",
      "USDPKR",
      "USDEGP",
      "USDBRL",
      "USDKZT",
      "USDINR",
      "USDNGN",
      "USDUAH",
      "USDTRY",
      "USDTHB",
      "USDVND",
      "USDBDT",
      "USDCNY"
    ],
    ["Крипта"]: ["BTCUSD", "LTCUSD", "XRPUSD", "ETHUSD"]
  };
  const unpackedPairs = Object.values(pairs).reduce((acc, e) => {
    acc.push(...e);
    return acc;
  }, []);

  const pairToReal = {
    BTCUSD: "#BITCOIN",
    LTCUSD: "#LITECOIN",
    ETHUSD: "#ETHEREUM",
    XRPUSD: "#RIPPLE",
    XAUUSD: "GOLD",
    XAGUSD: "SILVER",
    USDRUB: "USDRUR",
    EURRUB: "EURRUR"
  };
  const container = document.querySelector(".pfx-container");
  const this_scrp = container.querySelector("script");
  const css = document.createElement("link");
  css.type = "text/css";
  css.rel = "stylesheet";
  //подразумевается, что css имеет тоже самое имя, что и js
  css.href = this_scrp.src.replace(".js", ".css");
  css.onload = init.bind(this);
  document.head.appendChild(css);

  let currencyMap = undefined;
  const params = {
    currency: {
      name: "Валюта:",
      type: "select",
      value: 0,
      build: buildCurrency
    },
    currencyPair: {
      name: "Валютная пара:",
      type: "select",
      value: 0,
      build: async () => {
        const all = {};
        for (let name in pairs) {
          all["#" + name] = "#" + name;
          pairs[name].forEach(e => (all[e] = e));
        }
        return all;
      }
    },
    currencyTax: {
      name: "Курс:",
      type: "number"
    },
    shoulder: {
      name: "Плечо:",
      type: "select",
      value: "1:100",
      build: () => {
        let res = [
          5,
          10,
          20,
          25,
          30,
          33,
          40,
          50,
          60,
          100,
          125,
          150,
          200,
          300,
          400,
          500,
          600,
          1000,
          2000
        ];

        return res.reduce((obj, item) => {
          obj[`1:${item}`] = item;
          return obj;
        }, {});
      }
    },
    volume: {
      name: "Объем:",
      type: "number",
      value: 1,
      class: ["pfx-volume"],
      props: {
        min: "0.01",
        max: "10.0",
        step: "0.01"
      }
    },
    result: {
      name: "Маржа:"
    }
  };

  async function init() {
    const head = document.createElement("div");
    head.className += " pfx-header";
    head.innerHTML += `
    <span>${widget_name}</span>
    <a href="https://proFXtrader.ru">proFXtrader.ru</a>
    `;

    const loader = document.createElement("div");
    loader.innerHTML +=
      "<div> <div></div><div></div><div></div> </div><span>PROFX</br>TOOLS<span>";
    const el = document.createElement("div");
    el.style.display = "none";
    el.className += "pfx-item-container";
    loader.className += " pfx-loader";
    container.appendChild(head);
    container.appendChild(loader);
    container.appendChild(el);

    //load all curency
    const start = Date.now();
    await fetchCurrencyPair();
    console.log("Collecting time:", Date.now() - start);

    for (let e in params) {
      const data = params[e];
      el.appendChild(await createElement(e, data));
    }
    setTimeout(() => {
      el.style.display = "";
      loader.style.display = "none";
    }, 1000);
    onChange(undefined);
  }

  function calcTax(from, pair) {
    const dest = pair.slice(0, 3);
    const next = pair.slice(3);
    let direct = true;

    let resultPair = dest + from;
    let accum = 1;
    if (from !== dest) {
      if (currencyMap[dest + from]) {
        accum *= currencyMap[dest + from];
      } else if (currencyMap[from + dest]) {
        accum /= currencyMap[from + dest];
        resultPair = from + dest;
      } else {
        //гоним через USD, так как пары нет
        accum = calcTax(from, "USD" + dest).value;
        accum *= calcTax("USD", pair).value;
        resultPair = dest + from;
        direct = false;
      }
    }

    return {
      value: accum,
      name: resultPair,
      direct
    };
  }

  function calc(tax, vol, sh) {
    return (100000 * vol * tax) / sh;
  }

  function onChange(event) {
    const {
      result,
      currencyPair,
      currency,
      volume,
      shoulder,
      currencyTax
    } = params;

    const relTax = calcTax(currency.value, currencyPair.value);

    if (!event || event.target !== currencyTax.input) {
      currencyTax.label.innerHTML = `Курс (${relTax.name}):`;
      const val = relTax.value.toString().replace(",", ".");
      if (val.length - val.indexOf(".") - 1 < 4)
        relTax.value = relTax.value.toFixed(4);
      currencyTax.value = relTax.value;
    } else {
      relTax.value = currencyTax.value;
    }

    const resTax = calc(relTax.value, volume.value, shoulder.value);
    result.value = `${resTax.toFixed(2)} ${currency.value}`;

    if (relTax.direct) {
      result.body.classList.remove("pfx-error");
      currencyTax.body.classList.remove("pfx-error");
    } else {
      result.body.classList.add("pfx-error");
      currencyTax.body.classList.add("pfx-error");
    }
  }

  async function buildCurrency() {
    let currency = unpackedPairs.reduce((acc, e) => {
      acc.add(e.slice(3));
      acc.add(e.slice(0, 3));
      return acc;
    }, new Set());

    currency = Object.assign({}, ...[...currency].map(e => ({ [e]: e })));

    return currency;
  }

  async function fetchCurrencyPair() {
    currencyMap = {};
    const realToPair = Object.keys(pairToReal).reduce((acc, e) => {
      acc[pairToReal[e]] = e;
      return acc;
    }, {});
    const ids = unpackedPairs.map(e => pairToReal[e] || e).join(",");
    let req = api + encodeURIComponent(ids);
    const res = await fetch(req, { method: "GET" });
    if (res.status === 200) {
      const r = await res.json();
      r.forEach(e => {
        const real = realToPair[e.symbol.toUpperCase()] || e.symbol;
        currencyMap[real] = e.ask;
      });
    }
    const ress = Object.keys(currencyMap);
    console.log("Req:", unpackedPairs.length);
    console.log("Resp:", ress.length);
    return currencyMap;
  }

  async function createElement(name, data) {
    const body = document.createElement("div");
    body.classList.add("pfx-element", ...(data.class || []));
    body.id = name;

    const label = document.createElement("span");
    label.classList.add("pfx-label");
    label.innerText = data.name || name;
    body.appendChild(label);

    const startVal = data.value;
    let input;
    if (data.type === "select") {
      input = document.createElement("select");
      const map = data.build ? await data.build() : {};
      let parent = input;
      let index = 0;
      for (let name in map) {
        if (name.startsWith("#")) {
          const optGroup = document.createElement("optgroup");
          optGroup.label = name.substr(1);
          input.appendChild(optGroup);
          parent = optGroup;
        } else {
          const op = new Option(
            name,
            map[name],
            name === startVal,
            name === startVal
          );
          parent.appendChild(op);
        }
      }
    } else if (data.type !== undefined) {
      input = document.createElement("input");
      input.type = data.type || "text";
      input.value = startVal;
    } else {
      input = document.createElement("span");
    }

    for (const key in data.props || {}) {
      input[key] = data.props[key];
    }

    input.classList += " pfx-input";

    Object.defineProperty(data, "value", {
      get: function() {
        return this.input.value || this.input.innerHTML;
      },
      set: function(v) {
        if (this.input.value !== undefined) this.input.value = v;
        else this.input.innerHTML = "" + v;
      }
    });

    input.addEventListener("change", onChange);
    data.input = input;
    data.label = label;
    data.body = body;

    body.appendChild(input);
    return body;
  }
})();
