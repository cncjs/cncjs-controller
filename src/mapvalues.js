import noop from './noop';

const mapValues = (obj, fn = noop) => {
    const data = { ...obj };
    Object.keys(data).forEach(key => {
        const val = data[key];
        data[key] = fn && fn(val);
    });
    return data;
};

export default mapValues;
