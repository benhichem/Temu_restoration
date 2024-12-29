import { Page } from "puppeteer";
import { option, Product, variant } from "./types.js"
import axios from "axios";
import fs from "node:fs";
import path from "node:path"
import FormData from "form-data";


export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
  /*   await page.exposeFunction('GetOptions', GetOptions); */

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



export function extractUrl(input: string): string | null {
  const match = input.match(/url\("([^"]+)"\)/);
  return match ? match[1] : null;
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


export async function DownloadCapImage(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    let backgroundimage = document.querySelector('div.pic_wrapper')
    if (backgroundimage) {
      return window.getComputedStyle(backgroundimage).backgroundImage
    } else {
      return null
    }
  })
}


/**
 * Downloads a file from a URL and saves it locally
 * @param {string} fileUrl - The URL of the file to download
 * @param {string} [downloadDir='downloads'] - Directory to save the file (default: 'downloads')
 * @param {string} [fileName] - Optional custom filename. If not provided, extracts from URL
 * @returns {Promise<string>} - Path to the downloaded file
 */
export async function DownloadFile(fileUrl: string, downloadDir = 'downloads', fileName = null) {
  try {
    // Create downloads directory if it doesn't exist
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Get the filename from the URL if not provided
    const defaultFileName = fileName || path.basename(fileUrl);
    const filePath = path.join(downloadDir, defaultFileName);

    // Download file with axios
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream'
    });

    // Create write stream and pipe the response data
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    // Return promise that resolves when download completes
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    if (error instanceof Error)
      throw new Error(`File download failed: ${error.message}`);
  }
}


export async function Create2capReq(imagePath: string, CaptchaToken: string) {
  const formData = new FormData();
  formData.append('method', 'post');
  formData.append('key', CaptchaToken);
  formData.append('file', fs.createReadStream(imagePath));
  formData.append('coordinatescaptcha', 1); // Enable coordinates mode
  formData.append('json', 1);

  // Upload the CAPTCHA image
  const res = await axios.post('http://2captcha.com/in.php', formData, {
    headers: formData.getHeaders(),
  });

  const requestId = res.data.request;
  console.log('CAPTCHA Uploaded:', requestId);
  return requestId;
};

export async function Get2capResullts(requestId: string, captchaToken: string) {
  let result;
  while (!result) {
    await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
    const checkRes = await axios.get(
      `http://2captcha.com/res.php?key=${captchaToken}&action=get&id=${requestId}&json=1`
    );
    if (checkRes.data.status === 1) {
      result = checkRes.data.request;
      console.log(result.data);
    }
  }

  return result;
};




/**
 * Clicks multiple positions within a specified element
 * @param {puppeteer.Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector for the target element
 * @param {Array<{x: string, y: string}>} positions - Array of x,y coordinates to click
 * @param {Object} options - Additional options
 * @param {number} options.delay - Delay between clicks in milliseconds (default: 100)
 * @param {boolean} options.visualize - Whether to highlight click positions (default: false)
 */
export async function clickPositionsInElement(page: Page, selector: string, positions: Array<{ x: string, y: string }>, options: { delay?: number, visualize?: boolean } = {}) {

  const {
    delay = 1000,
    visualize = false
  } = options;

  try {
    // Wait for the element to be present
    await page.waitForSelector(selector);

    // Get the element
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }

    // Get element's bounding box
    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
      throw new Error('Could not get element bounding box');
    }

    // Add visualization style if enabled
    if (visualize) {
      await page.addStyleTag({
        content: `
                    .click-marker {
                        position: absolute;
                        width: 10px;
                        height: 10px;
                        background: red;
                        border-radius: 50%;
                        transform: translate(-50%, -50%);
                        pointer-events: none;
                        z-index: 10000;
                    }
                `
      });
    }

    // Click each position
    for (const position of positions) {
      // Calculate absolute position relative to the element
      const absoluteX = boundingBox.x + parseInt(position.x);
      const absoluteY = boundingBox.y + parseInt(position.y);

      // Validate click position is within element bounds
      if (
        absoluteX < boundingBox.x ||
        absoluteX > boundingBox.x + boundingBox.width ||
        absoluteY < boundingBox.y ||
        absoluteY > boundingBox.y + boundingBox.height
      ) {
        console.warn(`Click position (${position.x}, ${position.y}) is outside element bounds`);
        continue;
      }

      // Add visual marker if enabled
      if (visualize) {
        await page.evaluate(
          ({ x, y }) => {
            const marker = document.createElement('div');
            marker.className = 'click-marker';
            marker.style.left = `${x}px`;
            marker.style.top = `${y}px`;
            document.body.appendChild(marker);
            setTimeout(() => marker.remove(), 1000);
          },
          { x: absoluteX, y: absoluteY }
        );
      }

      // Perform the click
      await page.mouse.click(absoluteX, absoluteY);

      // Wait for specified delay
      await sleep(delay)

    }
  } catch (error) {
    if (error instanceof Error)
      throw new Error(`Failed to perform clicks: ${error.message}`);
  }
}
