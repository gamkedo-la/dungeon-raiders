import SceneKeys from '../Keys/sceneKeys.js'

class GameComplete extends Phaser.Scene {
  constructor () {
    super(SceneKeys.GameComplete)
  }

  preload () {

  }

  create () {
    this.cameras.main.fadeIn(2000, 0,0,0)
  }

  update (time, delta) {

  }
}

export default GameComplete