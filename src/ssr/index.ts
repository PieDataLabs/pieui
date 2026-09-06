/**
 * Серверный вход: то, что вызывается ИЗ серверного компонента.
 *
 * Отдельно от главного входа не для порядка, а по необходимости: сборка
 * помечает `dist/index.*` директивой `"use client"` — весь пакет клиентский, и
 * функция, импортированная оттуда, утянет за собой клиентскую границу вместо
 * того, чтобы выполниться на сервере. Здесь баннера нет.
 *
 * Внутри — серверный `PieServerPage`, который сам берёт конфиг и отдаёт его
 * клиентскому руту, и голая `loadPieConfig` на случай, когда конфиг нужен для
 * чего-то ещё: метаданных страницы, JSON-LD, карты сайта.
 */
export { default as PieServerPage } from './PieServerPage'
export type { PieServerPageProps } from './PieServerPage'
export { loadPieConfig } from '../util/loadPieConfig'
export type { LoadPieConfigParams, PieRequestInit } from '../util/loadPieConfig'
export type { UIConfigType } from '../types'
