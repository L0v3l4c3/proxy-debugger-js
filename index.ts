const globalNamespaceIndicator = /<anonymous>/;

const replacer = (_key: string, value: any) => {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries())
    };
  } else if (value instanceof Set) {
    return { dataType: "Set", value: Array.from(value) };
  } else {
    return value;
  }
};

enum PrintMode {
  DELETION,
  MUTATION
}

enum ColorPrefix {
  RED = "\x1b[31m",
  GREEN = "\x1b[32m"
}

const formatValue = (val: any, charLimit?: number) => {
  if (typeof val === "undefined") {
    return "undefined";
  } else if (typeof val === "object") {
    const stringifiedVal = JSON.stringify(val, replacer);
    const tail = Number.isInteger(charLimit) ? charLimit : 100;
    return stringifiedVal.length > (tail as number) ? stringifiedVal.substring(0, tail) + "..." : stringifiedVal;
  } else {
    return val.toString();
  }
};

interface Options<T> {
  breakOnDelete?: boolean | ((target: T, prop: keyof T) => boolean);
  breakOnGet?: boolean | ((target: T, prop: keyof T, value: T[keyof T]) => boolean);
  breakOnSet?: boolean | ((target: T, prop: keyof T, value: T[keyof T]) => boolean);
  valCharacterLimit?: number;
}

const debug = <T extends object>(
  object: T,
  opts: Options<T> = {
    breakOnDelete: false,
    breakOnGet: false,
    breakOnSet: false,
    valCharacterLimit: 100
  }
) => {
  const handler = {
    get(target: T, prop: keyof T, val: T[keyof T]) {
      if (opts.breakOnGet) {
        if (typeof opts.breakOnGet === "function") {
          if ((opts.breakOnGet as Function)(target, prop, val)) {
            debugger;
          }
        } else {
          debugger;
        }
      }
      return Reflect.get(target, prop, val);
    },

    deleteProperty(target: T, prop: keyof T) {
      try {
        throw new Error();
      } catch (err) {
        const methodStacktrace = err.stack.split("\n")[2];
        const tokens = methodStacktrace.split("\u0020");
        const methodLocation = tokens[6];

        console.log(buildPrintOutput(PrintMode.DELETION, methodLocation, tokens, prop, opts.valCharacterLimit));
      }

      if (opts.breakOnDelete) {
        if (typeof opts.breakOnDelete === "function") {
          if ((opts.breakOnDelete as Function)(target, prop)) {
            debugger;
          }
        } else {
          debugger;
        }
      }

      return delete target[prop];
    },

    set(target: T, prop: keyof T, val: T[keyof T]) {
      try {
        throw new Error();
      } catch (err) {
        const methodStacktrace = err.stack.split("\n")[2];
        const tokens = methodStacktrace.split("\u0020");
        const methodLocation = tokens[6];

        console.log(buildPrintOutput<T[keyof T]>(PrintMode.MUTATION, methodLocation, tokens, prop, opts.valCharacterLimit, val));
      }

      if (opts.breakOnSet) {
        if (typeof opts.breakOnSet === "function") {
          if ((opts.breakOnSet as Function)(target, prop, val)) {
            debugger;
          }
        } else {
          debugger;
        }
      }

      return Reflect.set(target, prop, val);
    }
  };
  return new Proxy(object, handler);
};

const buildPrintOutput = <V>(
  mode: PrintMode,
  methodLocation: string | undefined,
  tokens: Array<string>,
  prop: string | number | symbol,
  characterLimit: number | undefined,
  val?: V
) => {
  let string = `${ColorPrefix.RED}Property ${ColorPrefix.GREEN}${String(prop)} ${ColorPrefix.RED}being`;

  if (mode === PrintMode.DELETION) {
    string += ` deleted`;
  } else {
    string += ` set to ${ColorPrefix.GREEN}${formatValue(val, characterLimit)}`;
  }

  if (methodLocation === undefined) {
    const fallbackLocation = tokens[5];
    string += ` ${ColorPrefix.RED}at location ${ColorPrefix.GREEN}${fallbackLocation}`;
  } else {
    const methodName = tokens[5];

    if (globalNamespaceIndicator.test(methodName)) {
      string += ` ${ColorPrefix.RED}at location ${ColorPrefix.GREEN}${methodLocation}`;
    } else {
      string += ` ${ColorPrefix.RED}in function ${ColorPrefix.GREEN}${methodName} ${ColorPrefix.RED}at location ${ColorPrefix.GREEN}${methodLocation}`;
    }
  }

  return string;
};
  
  module.exports = {
    debug
  }
