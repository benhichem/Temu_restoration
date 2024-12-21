export type variant = {
  title: string;
  sku: string; // Optional
  price: number;
  compare_at_price: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  imageSrc: string;
};
export type Image = {
  id: string;
  src: string;
};
export type option = {
  name: string;
  values: Array<string>;
}

export type Product = {
  title: string;
  description: string;
  sizes: string[];
  images: Array<Image>;
  colors: string[];
  variants: Array<variant>;
  options: Array<option>;
  otherOptions: Array<string>
  image: { src: string };
};


export type ReturnProductType = {
  title: string;
  description: string;
  options: Array<option>;
  variants: Array<variant>;
  images: Array<Image>
  image: { src: string }
}
