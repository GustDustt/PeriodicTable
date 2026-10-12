// localStorage can be missing or throw (Safari private mode, blocked site
// data, quota). Settings and history are conveniences, so every failure here
// degrades to "not remembered" instead of breaking the calculator.
export const safeStorage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // ignored on purpose, see above
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignored on purpose, see above
    }
  },
}
