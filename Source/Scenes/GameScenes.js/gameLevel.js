import SceneKeys from "../../Keys/sceneKeys.js"
import AudioKeys, { AlertSound, PauseSound } from "../../Keys/audioKeys.js"
import MapManager from "../../Managers/mapManager.js"
import InputManager from '../../Managers/inputManager.js'
import CollisionManager from "../../Managers/collisionManager.js"
import EnemyManager from "../../Managers/enemyManager.js"
import { getLootForEnemy } from "../../Globals/enemyAttributes.js"
import LootManager from "../../Managers/lootManager.js"
import StoreManager from "../../Managers/storeManager.js"
import Character from "../../Entities/Characters/character.js"
import Exit from "../../Entities/Other/exit.js"
import Drawbridge from "../../Entities/Other/drawbridge.js"
import Door from "../../Entities/Other/door.js"
import { GameManagerKey } from "../../Managers/gameManager.js"
import { onDebug } from "../../Keys/inputEventKeys.js"
import Debug from "../../Globals/debug.js"
import { isMelee } from "../../Globals/weaponAttributes.js"

class GameLevel extends Phaser.Scene {
  constructor (sceneKey, mapKey) {
    super(sceneKey || SceneKeys.GameLevel)
    this.levelKey = sceneKey
    this.mapKey = mapKey
    this.gameManager = null // can't create this until the scene is initialized => in create()
    this.mapManager = null // can't create this until the scene is initialized => in create()
    this.inputManager = null // can't create this until the scene is initialized => in create()
    this.characters = []
    this.centerOfCharacters = null
    this.deadCharacterCount = 0
    this.exitedCharacterCount = 0
    this.debugGraphics = null
    this.alertSound = null
    this.voiceoverWelcomeSounds = []
    this.backgroundMusic = null
  }

  preload () {
    // May not need to preload anything here since we have a Preloader scene
  }

  create () {
    for (const key in AudioKeys) {
      const sound  = this.sound.add(key, { loop: AudioKeys[key].loop, volume: AudioKeys[key].volume })
      if (key === AlertSound) {
        this.alertSound = sound
      } else if (AudioKeys[key].type === 'voiceover') {
        this.voiceoverWelcomeSounds.push(sound)
      }
    }

    this.physics.world.debugGraphic.visible = false
    this.gameManager = this.game.registry.get(GameManagerKey)
    if (Debug.SkipTitleScene && Debug.SkipCharacterCreateScene) {
      this.input.gamepad.on(Phaser.Input.Gamepad.Events.CONNECTED, pad => {
        this.gameManager.addGamepad(pad)
      })
    }
    this.mapManager = new MapManager(this, this.mapKey, this.gameManager)
    this.collisionManager = new CollisionManager(this, this.mapManager)
    this.enemyManager = new EnemyManager(this, this.mapManager, this.collisionManager, this.gameManager)
    this.lootManager = new LootManager(this, this.mapManager, this.collisionManager, this.gameManager)
    this.storeManager = new StoreManager(this, this.mapManager, this.collisionManager, this.gameManager, this.lootManager)
    this.inputManager = new InputManager(this, this.gameManager)
    this.inputManager.registerForEvent(onDebug, this.toggleDebug, this)
    this.centerOfCharacters = new Phaser.GameObjects.GameObject(this, 0, 0)

    this.createCharacters()
    this.createExits()
    this.createDrawbridges()
    this.createDoors()
    this.setupCamera()

    this.debugGraphics = this.add.graphics()
    this.scene.launch(SceneKeys.UserInterface, this)
    this.mapManager.startTileAnimations()
    this.scene.bringToTop(SceneKeys.UserInterface)

    this.cameras.main.fadeIn(2000, 0,0,0)

    this.events.on(Phaser.Scenes.Events.PAUSE, this.togglePause, this)
    this.events.on(Phaser.Scenes.Events.RESUME, this.togglePause, this)
  }

  createCharacters () {
    const activePlayers = this.gameManager.getActivePlayers()
    for (const activePlayer of activePlayers) {
      const attributes = this.gameManager.getCharacterAttributesForPlayer(activePlayer)
      const character = (new Character(this, {
        attributes,
        player: activePlayer,
        race: this.gameManager.getCharacterRaceForPlayer(activePlayer),
        characterClass: this.gameManager.getCharacterClassForPlayer(activePlayer),
        gameManager: this.gameManager,
        inputEvent: this.gameManager.getInputEventForPlayer(activePlayer)
      }))

      const playerSpawnPos = this.mapManager.getPlayerSpawn(activePlayer, this.gameManager.getActiveExit()?.exitId)
      character.setPosition(playerSpawnPos.x, playerSpawnPos.y)

      this.collisionManager.addEntity(character, character.attributes.radius) // add the character to the physics simulation and enable collisions
      this.add.existing(character) // add the character to the scene => will be visible and updated

      this.characters.push(character)
    }

    this.gameManager.clearActiveExit() // Clear the active exit now that we've spawned the characters
  }

  createExits () {
    for (const exit of this.mapManager.exits) {
      exit.gameManager = this.gameManager
      this.collisionManager.addEntity(new Exit(this, exit)) // add the exit to the physics simulation and enable collisions
    }
  }

  createDrawbridges () {
    for (const drawbridge of this.mapManager.drawbridges) {
      drawbridge.gameManager = this.gameManager
      this.collisionManager.addEntity(new Drawbridge(this, drawbridge))
    }
  }

  createDoors() {
    for (const door of this.mapManager.doors) {
      door.gameManager = this.gameManager
      this.collisionManager.addEntity(new Door(this, door))
    }
  }

  createLoot () {
    for (const loot of this.mapManager.loot) {

      this.collisionManager.addEntity(loot) // add the loot to the physics simulation and enable collisions
    }
  }

  setupCamera () {
    this.cameras.main.setBounds(0, 0, this.mapManager.map.widthInPixels, this.mapManager.map.heightInPixels)
    this.cameras.main.setZoom(0.5)
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 2,
      delay: 500,
      duration: 2000,
      ease: Phaser.Math.Easing.Quadratic.InOut,
      onComplete: () => {
        this.cameras.main.startFollow(this.centerOfCharacters, true, 0.1, 0.1)
        for (const character of this.characters) {
          character.setInputManager(this.inputManager)
          character.levelDidStart()
        }

        for (const enemy of this.enemyManager.enemies) {
          enemy.levelDidStart()
        }
      },
      onCompleteScope: this
    })
  }

  update (time, delta) {
    if (!this.hasWelcomedPlayers) {
        // play a random welcome message (for now)
        this.alertSound.play()
        this.voiceoverWelcomeSounds[Math.floor(Math.random()*this.voiceoverWelcomeSounds.length)].play()
        this.hasWelcomedPlayers = true
    }

    if (this.characters.length === 0) {
      this.createCharacters()
      if (this.characters.length === 0) return
    }

    this.inputManager.update(time, delta)
    this.enemyManager.update(time, delta)
    if (this.physics.world.debugGraphic.visible) {
      this.drawDebug()
    } else {
      this.debugGraphics.clear()
    }

    this.setCameraPosition()
  }

  setCameraPosition () {
    let characterXs = []
    let characterYs = []
    for (const character of this.characters) {
      if (!character.canBePursued()) continue
      characterXs.push(character.x)
      characterYs.push(character.y)
    }

    if (characterXs.length === 0) return

    const minX = Math.min(...characterXs)
    const maxX = Math.max(...characterXs)
    const minY = Math.min(...characterYs)
    const maxY = Math.max(...characterYs)

    this.centerOfCharacters.x = Math.round((maxX + minX) / 2)
    this.centerOfCharacters.y = Math.round((maxY + minY) / 2)

    if (this.cameras.main.zoom < 2) {
      if (Math.abs(maxX - minX) + this.characters[0].width <= this.cameras.main.width / this.cameras.main.zoom) {
        this.cameras.main.centerOnX((maxX + minX) / 2)
      }

      if (Math.abs(maxY - minY) + this.characters[0].height <= this.cameras.main.height / this.cameras.main.zoom) {
        this.cameras.main.centerOnY((maxY + minY) / 2)
      }
    }

    if (this.cameras.main.worldView.right !== 0 && this.cameras.main.worldView.bottom !== 0) {
      for (const character of this.characters) {
        character.x = Phaser.Math.Clamp(character.x, this.cameras.main.worldView.left + character.width / 2, this.cameras.main.worldView.right - character.width / 2)
        character.y = Phaser.Math.Clamp(character.y, this.cameras.main.worldView.top + character.height / 2, this.cameras.main.worldView.bottom - character.height / 2)
      }
    }
  }

  getClosestCharacter (entity) {
    const distances = this.characters.map(character => {

      const distance = !character.canBePursued() ? Number.MAX_VALUE : Phaser.Math.Distance.Between(entity.x, entity.y, character.x, character.y)
      return { character, distance }
    })

    distances.sort((a, b) => a.distance - b.distance)
    if (distances[0].distance === Number.MAX_VALUE) return { closestCharacter: null, distance: Number.MAX_VALUE }
    return { closestCharacter: distances[0].character, distance: distances[0].distance }
  }

  enemyKilledBy (enemy, otherEntity) {
    if (!!otherEntity) {
			const loot = getLootForEnemy(enemy)
			otherEntity.addLoot(loot)
    }
  }

  characterExited (character) {
    this.exitedCharacterCount++
    this.processCharacterOutOfPlay(character)
    // TODO: Any other logic that needs to happen when a character exits the level
  }

  characterDied (character) {
    this.deadCharacterCount++
    character.characterDied()
    this.processCharacterOutOfPlay(character)
  }

  processCharacterOutOfPlay (character) {
    if (this.exitedCharacterCount + this.deadCharacterCount >= this.characters.length) {

      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, function (camera) {

        if (this.key === SceneKeys.FinalLevel) {
          this.scene.start(SceneKeys.GameComplete)
        } else {
          this.deadCharacterCount >= this.characters.length ? this.scene.start(SceneKeys.GameOver) : this.gameManager.goToInterLevelScene()
        }
  
        this.shutdown()

      }, this)

      this.cameras.main.fadeOut(2000)
    }
  }

  purchaseItem (character, item) {
    const lootVersionOfStoreItem = this.storeManager.getLootForStoreItem(item)
    character.collectedLoot(lootVersionOfStoreItem)
  }

  destructibleWallHit (wallTile, weapon) {
    this.mapManager.damageDestructibleWall(wallTile)
    if (isMelee(weapon)) {
      this.mapManager.damageDestructibleWall(wallTile)
    }
  }

  shutdown () {
    for (const sound of this.sound.sounds) sound.stop()
    for (const character of this.characters) character.shutdown()
    this.collisionManager.shutdown()
    this.enemyManager.shutdown()

    this.scene.stop(SceneKeys.UserInterface)
    this.scene.remove(this.scene.key)
  }

  toggleDebug () {
    this.physics.world.debugGraphic.visible = !this.physics.world.debugGraphic.visible
  }

  togglePause () {
    this.sound.play(PauseSound, { loop: AudioKeys[PauseSound].loop, volume: AudioKeys[PauseSound].volume })
    if (this.scene.isPaused(this)) {
      this.sound.pauseAll()
    } else {
      this.sound.resumeAll()
    }
  }

  drawDebug () {
    this.debugGraphics.clear()
    this.mapManager.map.renderDebugFull(this.debugGraphics, {
      tileColor: null,
      collidingTileColor: new Phaser.Display.Color(255, 0, 0, 100),
      faceColor: new Phaser.Display.Color(40, 39, 37, 255)
    })
  }
}

export default GameLevel