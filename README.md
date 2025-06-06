This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 项目使用指南

首先，安装项目依赖：

```bash
npm install
```

然后，运行开发服务器：

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看结果。

你可以通过修改 `app/page.tsx` 文件来编辑页面。当你编辑文件时，页面会自动更新。

### 其他命令

**构建项目:**

```bash
npm run build
```

**启动生产环境服务器:**

```bash
npm run start
```

**代码规范检查:**

```bash
npm run lint
```

### 环境变量

在运行项目之前，您需要创建一个 `.env.local` 文件，并添加必要的环境变量。

首先，在项目根目录创建一个名为 `.env.local` 的文件，然后复制以下内容并填入您的密钥：

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# Add other environment variables here
```

**注意:** `.env.local` 文件不应该被提交到版本库中。

### 代码规范

本项目使用 [Husky](https://typicode.github.io/husky/) 在每次提交代码时自动进行代码规范检查。

当您执行 `git commit` 时，`pre-commit` 钩子会自动运行 `npm run lint` 命令，以确保代码质量。

## 了解更多

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
