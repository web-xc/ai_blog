---
title: 现代 UI 的「精致感」到底来自哪里
date: 2026-11-05
category: 设计笔记
tags: [UI 设计, 动效, CSS, 玻璃拟态]
cover: ✨
excerpt: 不是多加几个渐变，而是让层次、节奏与反馈都恰到好处：一份关于动效与设计变量的实践笔记。
---

## 精致感不是特效堆出来的

刚开始做界面时，很容易把「好看」理解成「加特效」：阴影再重一点、渐变再多一层、动画再花一点。结果往往是页面很吵，看久了累。

后来我发现，真正让界面显得精致的是三件事：**有层次的留白、一致的设计变量、克制的反馈**。特效只是最后 10%。

## 先建立设计变量

所有颜色、圆角、阴影、间距都从 CSS 变量出发，亮暗主题只覆盖变量本身，组件样式一行都不用改：

```css
:root {
  --surface: rgba(255, 255, 255, .72);
  --border: rgba(24, 32, 62, .09);
  --text: #171b2e;
  --accent: #6366f1;
  --radius: 18px;
  --ease: cubic-bezier(.22, 1, .36, 1);
}

html[data-theme="dark"] {
  --surface: rgba(22, 27, 46, .68);
  --text: #eef1ff;
  /* ... */
}
```

把强调色转成 `--accent-rgb` 之后，透明度变体也能统一管理：

```css
background: rgba(var(--accent-rgb), .1);
```

## 缓动曲线决定气质

线性动画看起来像机械运动，而 `cubic-bezier(.22, 1, .36, 1)` 这类「先快后缓」的曲线会带来自然的减速感。整个项目只用一条主曲线，界面就有了统一的运动气质。

| 场景 | 时长 | 手法 |
| --- | --- | --- |
| 按钮 hover | 250–300ms | 位移 2px + 阴影加深 |
| 卡片 hover | 350–450ms | 上浮 6px + 边框染色 |
| 元素入场 | 600–800ms | 上移 24px + 淡入，带 stagger |
| 页面切换 | 450ms | `mode="out-in"` 淡入上移 |

## 滚动揭示

用 `IntersectionObserver` 写一个 `v-reveal` 指令，比在每个组件里写监听干净得多：

```ts
export const reveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    el.classList.add('reveal')
    el.style.setProperty('--reveal-delay', `${binding.value ?? 0}ms`)
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        io.unobserve(entry.target)
      }
    }, { threshold: .08, rootMargin: '0px 0px -48px 0px' })
    io.observe(el)
  },
}
```

卡片列表按索引递增延迟（`i * 80ms`），视线扫过去时像波浪一样依次亮起。注意只触发一次，反复进出视口都重播会非常烦人。

## 一点「跟随感」

卡片上放一层跟随鼠标的径向光晕，成本极低但很讨喜：

```ts
function onMove(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
}
```

```css
.card::before {
  background: radial-gradient(340px circle at var(--mx) var(--my),
              rgba(var(--accent-rgb), .13), transparent 68%);
  opacity: 0;
}
.card:hover::before { opacity: 1; }
```

## 别忘了照顾「不喜欢动画」的人

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
  .reveal { opacity: 1; transform: none; }
}
```

这不是可选项。同样地，用 `requestAnimationFrame` 驱动的粒子背景，在这个偏好下应当直接停掉。

> 好的动效让人注意到内容，而不是注意到动效本身。

## 小结

设计变量保证一致，缓动曲线保证气质，stagger 保证节奏，`prefers-reduced-motion` 保证体面。剩下的渐变、玻璃、光晕，只是把这些原则表达出来的语言而已。
