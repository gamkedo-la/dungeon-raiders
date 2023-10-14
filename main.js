import Preloader from './Source/Scenes/preloader.js'
import Title from './Source/Scenes/title.js'
import Credits from './Source/Scenes/credits.js'
import Options from './Source/Scenes/options.js'
import GameLevel from './Source/Scenes/GameScenes.js/gameLevel.js'
import Level1 from './Source/Scenes/GameScenes.js/level1.js'
import Level2 from './Source/Scenes/GameScenes.js/level2.js'
import Level3 from './Source/Scenes/GameScenes.js/level3.js'
import GameOver from './Source/Scenes/gameOver.js'
import GameComplete from './Source/Scenes/gameComplete.js'
import UserInterface from './Source/Scenes/userInterface.js'

const scenes = [
  Preloader,
  Title,
  Credits,
  Options,
  GameLevel,
  Level1,
  Level2,
  Level3,
  GameOver,
  GameComplete,
  UserInterface
]

const Game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1600,
  height: 900,
  scene: scenes,
  physics: {
    default: 'arcade'
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true
})

export default Game