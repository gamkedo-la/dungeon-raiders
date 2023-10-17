import { PreloaderKey, TitleKey, Level1Key } from '../Keys/sceneKeys.js'
import ImageKeys from '../Keys/imageKeys.js'
import AudioKeys from '../Keys/audioKeys.js'
import MapKeys from '../Keys/mapKeys.js'
import AtlasKeys from '../Keys/atlasKeys.js'

class Preloader extends Phaser.Scene {
  constructor () {
    super(PreloaderKey)
  }

  preload () {
    for (const key in ImageKeys) {
      this.load.image(ImageKeys[key], `../../Public/Images/${ImageKeys[key]}.png`)
    }

    for (const key in MapKeys) {
      this.load.tilemapTiledJSON(MapKeys[key], `../../Public/Maps/${MapKeys[key]}.json`)
    }

    for (const key in AudioKeys) {
      this.load.audio(AudioKeys[key], `../../Public/Audio/${AudioKeys[key]}.mp3`)
    }

    for (const key in AtlasKeys) {
      this.load.atlas(AtlasKeys[key].image, `../../Public/Images/${AtlasKeys[key].image}.png`, `../../Public/SpriteSheetData/${AtlasKeys[key].data}.json`)
    }
  }

  create () {
    // this.scene.start(TitleKey)
    this.scene.start(Level1Key)
    this.scene.remove(PreloaderKey)
  }
}

export default Preloader
