import Loot from "./loot.js"
import { WeaponWarHammerMagicImage } from "../../Keys/imageKeys.js"
import { WeaponNames } from '../../Globals/weaponAttributes.js'

export default class WeaponWarHammerMagic extends Loot {
  static Loot = {
    attribute: 'weapon',
    name: WeaponNames.WarHammerMagic,
    value: 1
  }
  constructor (scene, config) {
    config.image = WeaponWarHammerMagicImage
    super(scene, config)
    this.radius = config.radius || 8
    this.loot = {...WeaponWarHammerMagic.Loot}
  }
}
