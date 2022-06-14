const globalNamespaceIndicator = /<anonymous>/;

const replacer = (_key, value) => {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries()),
    };
  } else if (value instanceof Set) {
    return { dataType: "Set", value: Array.from(value) };
  } else {
    return value;
  }
};

const printMode = {
  DELETION: "DELETION",
  MUTATION: "MUTATION",
};

const colorPrefix = {
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
};

const formatValue = (val, charLimit) => {
  if (typeof val === "undefined") {
    return "undefined";
  } else if (typeof val === "object") {
    const stringifiedVal = JSON.stringify(val, replacer);
    const tail = Number.isInteger(charLimit) ? charLimit : 100;
    return stringifiedVal.length > tail
      ? stringifiedVal.substring(0, tail) + "..."
      : stringifiedVal;
  } else {
    return val.toString();
  }
};

const debug = (
  object,
  opts = {
    breakOnDelete: false,
    breakOnGet: false,
    breakOnSet: false,
    valCharacterLimit: 100,
  }
) => {
  const handler = {
    get(target, prop, val) {
      if (opts.breakOnGet) {
        debugger;
      }
      return Reflect.get(target, prop, val);
    },

    deleteProperty(target, prop) {
      try {
        throw new Error();
      } catch (err) {
        const methodStacktrace = err.stack.split("\n")[2];
        const tokens = methodStacktrace.split("\u0020");
        const methodLocation = tokens[6];

        console.log(
          buildPrintOutput(
            printMode.DELETION,
            methodLocation,
            tokens,
            prop,
            opts.valCharacterLimit
          )
        );
      }

      if (opts.breakOnDelete) {
        debugger;
      }

      return delete target[prop];
    },

    set(target, prop, val) {
      try {
        throw new Error();
      } catch (err) {
        const methodStacktrace = err.stack.split("\n")[2];
        const tokens = methodStacktrace.split("\u0020");
        const methodLocation = tokens[6];

        console.log(
          buildPrintOutput(
            printMode.MUTATION,
            methodLocation,
            tokens,
            prop,
            opts.valCharacterLimit,
            val
          )
        );
      }

      if (opts.breakOnSet) {
        debugger;
      }

      return Reflect.set(target, prop, val);
    },
  };
  return new Proxy(object, handler);
};

const buildPrintOutput = (
  mode,
  methodLocation,
  tokens,
  prop,
  characterLimit,
  val
) => {
  let string = `${colorPrefix.RED}Property ${colorPrefix.GREEN}${prop} ${colorPrefix.RED}being`;

  if (mode === printMode.DELETION) {
    string += ` deleted`;
  } else {
    string += ` set to ${colorPrefix.GREEN}${formatValue(val, characterLimit)}`;
  }

  if (methodLocation === undefined) {
    const fallbackLocation = tokens[5];
    string += ` ${colorPrefix.RED}at location ${colorPrefix.GREEN}${fallbackLocation}`;
  } else {
    const methodName = tokens[5];

    if (globalNamespaceIndicator.test(methodName)) {
      string += ` ${colorPrefix.RED}at location ${colorPrefix.GREEN}${methodLocation}`;
    } else {
      string += ` ${colorPrefix.RED}in function ${colorPrefix.GREEN}${methodName} ${colorPrefix.RED}at location ${colorPrefix.GREEN}${methodLocation}`;
    }
  }

  return string;
};

module.exports = {
  debug,
};
