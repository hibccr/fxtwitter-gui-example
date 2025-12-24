# fxtwitter-gui-example

This project is a Web GUI of FxEmbed's api. Written by Vue3 and Vite.

If you want to read FxEmbed's api docs, please jump to [https://github.com/FxEmbed/FxEmbed/wiki/API-Home](https://github.com/FxEmbed/FxEmbed/wiki/API-Home)

> [!CAUTION]
> Disclaimer: This project is not affiliated with​​ FxEmbed, and it is a ​​rudimentary prototype project. If you have any questions regarding this project, please submit them via the Issues.  

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

> [!NOTE]
> This project require Git to get current git commit hash, if you not use it, please delete ``__GIT_COMMIT_ID__`` define in ``vite-env.d.ts``, ``vite.config.js`` and ``@/components/Main.vue``.

> [!IMPORTANT]
> Due to X's restrictions, X now checks the request referer header on video.twimg.com. You need to configure your server to add the `Referrer-Policy: no-referrer` HTTP response header to prevent the browser from sending the referer header, in order to properly load videos from X.

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
