export default function setPause(timeout) {
    return new Promise((resolve) => {
        setTimeout(() => resolve('it\'s time!'), timeout);
    });
}