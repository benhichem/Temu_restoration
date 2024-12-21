import { Page } from "puppeteer";
import { option, Product, variant } from "./types.js"

export async function GetPrices(
  page: Page
): Promise<{ current_price: string; old_price: string }> {
  let priced = await page.evaluate(() => {
    return {
      current_price: document.querySelector("div.from.original")
        ? (
          document.querySelector("div.from.original") as HTMLDivElement
        ).innerText.replace(/[^0-9$.]/g, "")
        : "",
      old_price: document.querySelector("del.del-price")
        ? (
          document.querySelector("del.del-price") as HTMLSpanElement
        ).innerText.replace(/[^0-9$.]/g, "")
        : "",
    };
  });
  return priced;
}



export async function GetProductInfo(page: Page): Promise<Product> {
  await page.exposeFunction('GetOptions', GetOptions)
  const info: Product = await page.evaluate(async () => {
    let title = document.querySelector("h1.product-intro__head-name")
      ? (
        document.querySelector(
          "h1.product-intro__head-name"
        ) as HTMLHeadElement
      ).innerText
      : "";

    let description: any = {};
    document.querySelectorAll("div.product-intro__description-table-item")
      ? Array.from(
        document.querySelectorAll(
          "div.product-intro__description-table-item"
        )
      ).map((row) => {
        let key = row.querySelector("div.key")
          ? (row.querySelector("div.key") as HTMLDivElement).innerText
          : "";
        let value = row.querySelector("div.val")
          ? (row.querySelector("div.val") as HTMLDivElement).innerText
          : "";
        description[key] = value;
      })
      : "";

    let image: string = document
      .querySelector("div[data-background-image]")!
      .getAttribute("data-background-image")
      ? document
        .querySelector("div[data-background-image]")!
        .getAttribute("data-background-image")!
      : "";

    // The ID was not avaliable in the shop but i did notice they label the images as for Example T-shirt-1 ...
    let images = document.querySelectorAll("div.product-intro__thumbs-item")
      ? Array.from(
        document.querySelectorAll("div.product-intro__thumbs-item")
      ).map((image, index) => {
        return {
          id: (index + 1).toString(),
          src: (image.querySelector("img") as HTMLImageElement).src,
        };
      })
      : [];

    let vendor = document.querySelector("div.name-line")
      ? (document.querySelector("div.name-line") as HTMLDivElement).innerText
      : "";

    let variants: Array<variant> = [];

    return {
      title,
      description: JSON.stringify(description),
      options: [],
      sizes: [],
      variants,
      images,
      image: { src: image },
      colors: [],
      otherOptions: [],
      vendor,
    };
  });
  let updatedInfo = await GetOptions(page, info)
  return updatedInfo
}
import { COLORS_SELECTOR, SIZE_SELECTOR, OTHER_OPTIONS } from "./lib/selctors.js"

export async function GetVar(Page: Page, x: "color" | "size" | "otherOptions") {
  var selector = ""

  switch (x) {
    case "color":
      selector = COLORS_SELECTOR
    case "size":
      selector = SIZE_SELECTOR
    case "otherOptions":
      selector = OTHER_OPTIONS
    default:
      break;
  }

  await Page.evaluate(() => {

  })

}

export async function GenerateVariants(info: Product, Page: Page): Promise<Product | null> {

  const colors = info.colors.length ? true : false;
  const sizes = info.sizes.length ? true : false;
  //const otherOptions = info.otherOptions ? true : false;

  if (colors === true) {
    const product = await Page.evaluate(async (info) => {
      function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      const colors = Array.from(document.querySelector('div.goods-color__radio-container')!.querySelectorAll('span'))
      for (let index = 0; index < colors.length; index++) {
        const color = colors[index];
        (color.querySelector('div.goods-color__radio') as HTMLDivElement).click()
        await sleep(5000);
        const imgsrc = await document.querySelector("div[data-background-image]")!.getAttribute('data-background-image')
          ? document.querySelector("div[data-background-image]")!.getAttribute('data-background-image')
          : "";

        const curentPrice = document.querySelector("div.from.original")
          ? (
            document.querySelector("div.from.original") as HTMLDivElement
          ).innerText.replace(/[^0-9$.]/g, "")
          : "";

        const old_price = document.querySelector("del.del-price") ? (
          document.querySelector("del.del-price") as HTMLSpanElement
        ).innerText.replace(/[^0-9$.]/g, "")
          : "";



        if (info.sizes.length === 0) {
          let title = info.colors[index]
          info.variants.push({
            title,
            sku: "",
            price: eval(curentPrice.slice(1)) ? eval(curentPrice.slice(1)) : 0,
            compare_at_price: eval(old_price.slice(1)) ? eval(old_price.slice(1)) : 0,
            option1: info.colors[index],
            option2: null,
            option3: null,
            imageSrc: imgsrc ? imgsrc : ""
          })
        } else if (info.sizes.length > 0) {
          for (let j = 0; j < info.sizes.length; j++) {
            const size = info.sizes[j];
            if (size === undefined) break;
            if (info.otherOptions.length === 0) {
              info.variants.push({
                title: `${info.colors[index]} / ${size}`,
                sku: "",
                price: eval(curentPrice.slice(1)) ? eval(curentPrice.slice(1)) : 0,
                compare_at_price: eval(old_price.slice(1)) ? eval(old_price.slice(1)) : 0,
                option1: info.colors[index],
                option2: size,
                option3: null,
                imageSrc: imgsrc ? imgsrc : ""
              })
            } else {
              for (let o = 0; o < info.otherOptions.length; o++) {

                let OtherOption = info.otherOptions[o];
                if (OtherOption === undefined) break;
                info.variants.push({
                  title: `${info.colors[index]} / ${size} / ${OtherOption}`,
                  sku: "",
                  price: eval(curentPrice.slice(1)) ? eval(curentPrice.slice(1)) : 0,
                  compare_at_price: eval(old_price.slice(1)) ? eval(old_price.slice(1)) : 0,
                  option1: info.colors[index],
                  option2: size,
                  option3: OtherOption,
                  imageSrc: imgsrc ? imgsrc : ""
                })

              }

            }
          }
        }
      }
      return info
    }, info)
    return product ? product : null
  } else if (sizes === true) {
    const prices = await GetPrices(Page)
    for (var j = 0; j <= info.sizes.length; j++) {
      if (j + 1 > info.sizes.length) break;
      let imgsrc = await Page.evaluate(() => {
        return document.querySelector('div[data-background-image]')
          ? document.querySelector("div[data-background-image]")!.getAttribute("data-background-image")
          : ""
      })
      let title = info.sizes[j];
      info.variants.push({
        title,
        sku: "",
        price: eval(prices.current_price.slice(1)) ? eval(prices.current_price.slice(1)) : 0,
        compare_at_price: eval(prices.old_price.slice(1)) ? eval(prices.old_price.slice(1)) : "",
        option1: null,
        option2: info.sizes[j],
        option3: null,
        imageSrc: imgsrc ? imgsrc : ""
      })
    }
    return info
  } else {
    return info
  }
}





export async function GetOptions(Page: Page, info: Product) {

  return await Page.evaluate((info) => {
    let colors = document.querySelectorAll("div.goods-color__radio")
      ? Array.from(document.querySelectorAll("div.goods-color__radio")).map(
        (color) => {
          return color.getAttribute("aria-label")
            ? color.getAttribute("aria-label")!
            : "";
        }
      )
      : [];
    let sizes = document.querySelectorAll("p.product-intro__size-radio-inner")
      ? Array.from(
        document.querySelectorAll("p.product-intro__size-radio-inner")
      ).map((size) => {
        return (size as HTMLParagraphElement).innerText;
      })
      : [];

    let otherOptions = document.querySelector('#goods-detail-v3 > div > div.goods-detailv2__media > div > div.product-intro > div.product-intro__info > div > div.product-intro__select-box > div.goods-size-group__wrapper > div.product-intro__size-title > div')
      ? Array.from(document.querySelectorAll('#goods-detail-v3 > div > div.goods-detailv2__media > div > div.product-intro > div.product-intro__info > div > div.product-intro__select-box > div.goods-size-group__wrapper > div:nth-child(2) > ul > li ')).map((item) => { return (item as HTMLDListElement).innerText })
      : []
    if (colors.length > 0) {
      info.options.push({
        name: "Color",
        values: colors,
      });
    }

    if (sizes.length > 0) {
      info.options.push({
        name: "Size",
        values: sizes,
      });
    }
    if (otherOptions.length > 0) {
      info.options.push({
        name: 'Other Options',
        values: otherOptions
      })
    }

    colors.map((color) => { info.colors.push(color) })
    // INFO: the sizes collection also collects the other options sizes 
    sizes.map((size) => {
      if (!otherOptions.includes((size))) {
        info.sizes.push(size)
      }
    })
    otherOptions.map((OtherOption) => { info.otherOptions.push(OtherOption) })
    return info
  }, info)

}
