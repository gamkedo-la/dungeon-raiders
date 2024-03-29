import EntityTypes from '../../Globals/entityTypes.js'
import { DoorImage } from '../../Keys/imageKeys.js'

export default class Door extends Phaser.GameObjects.Sprite {
  constructor (scene, config) {
    super(scene, config.x, config.y, DoorImage)

    this.scene = scene
    this.id = config.id
    this.entityType = EntityTypes.Door
    this.gameManager = config.gameManager
    this.name = config.name
    this.scene.add.existing(this)
  }

  didCollideWith (otherEntity) {
    if (otherEntity.entityType === EntityTypes.Character) {
      if (otherEntity.attributes.loot.keys > 0) {
        otherEntity.attributes.loot.keys--
        this.gameManager.destroyObject(this.scene.levelKey, this.id)
        this.destroy()
      }
    }
  }
}