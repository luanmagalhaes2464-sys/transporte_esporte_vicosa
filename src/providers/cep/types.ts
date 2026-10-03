export type AddressResult = {
  cep: string;
  street?: string;
  neighborhood?: string;
  city: string;
  state: string;
  provider: string;
  raw?: unknown;
};
export interface CepProvider { lookup(cep: string): Promise<AddressResult>; }
