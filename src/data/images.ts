/**
 * Curated product photography (Unsplash CDN, license-free).
 * Kept in one place so a future CDN/asset-pipeline swap is a one-file change.
 */

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1080&q=80`;

export const IMG = {
  iphoneDark: u('photo-1591337676887-a217a6970a8a'),
  iphoneHand: u('photo-1510557880182-3d4d3cba35a5'),
  iphoneTable: u('photo-1512499617640-c74ae3a79d37'),
  iphoneCamera: u('photo-1592750475338-74b7b21085ab'),
  iphonePro: u('photo-1523206489230-c012c64b2b48'),
  galaxy: u('photo-1610945265064-0e34e5519bbf'),
  galaxyFold: u('photo-1565849904461-04a58ad377e0'),
  pixel: u('photo-1598327105666-5b89351aff97'),
  macbookDesk: u('photo-1517336714731-489689fd1ca8'),
  macbookSide: u('photo-1611186871348-b1ce696e52c9'),
  macbookCode: u('photo-1496181133206-80ce9b88a853'),
  macbookAir: u('photo-1541807084-5c52b6b3adef'),
  gamingLaptop: u('photo-1603302576837-37561b2e2302'),
  laptopKeys: u('photo-1593642632823-8f785ba67e45'),
  laptopDesk: u('photo-1525547719571-a2d4ac8945e2'),
  headphones: u('photo-1505740420928-5e560c06d30e'),
  headphonesWhite: u('photo-1583394838336-acd977736f90'),
  earbuds: u('photo-1600294037681-c80b4cb5b434'),
  airpods: u('photo-1572569511254-d8f925fe2cbb'),
  appleWatch: u('photo-1579586337278-3befd40fd17a'),
  smartwatch: u('photo-1546868871-7041f2a55e12'),
  ipad: u('photo-1544244015-0df4b3ffc6b0'),
  deskSetup: u('photo-1586953208448-b95a79798f07'),
} as const;
