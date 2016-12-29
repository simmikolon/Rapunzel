//
//  GameSceneCreateLevelLayerState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class GameSceneCreateLevelEntityState: GameSceneState {

    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        createScene()
        gameScene.stateMachine.enter(GameScenePlayingState.self)
    }
    
    fileprivate func createScene() {
        
        let levelEntity = LevelEntity()
        levelEntity.name = "LevelEntity"
        gameScene.addChild(levelEntity.renderComponent.node)
        
        /* Erstellen von PlayerEntity */
        
        let playerEntity = PlayerEntity()
        playerEntity.renderComponent.node.zPosition = 60
        playerEntity.renderComponent.node.position = CGPoint(x: 0, y: 150)
        playerEntity.name = "PlayerEntity"
        
        /* Camera Entity erstellen und Hinzufügen */
        
        let cameraEntity = CameraEntity(withFocusedNode: playerEntity.renderComponent.node)
        cameraEntity.name = "CameraEntity"
        
        /* Erstellen von ActionLayerEntity */
        
        let playerLayerEntity = ActionLayerEntity(cameraComponent: cameraEntity.cameraComponent, zPosition: 5)
        playerLayerEntity.renderComponent.addChild(playerEntity.renderComponent.node)
        playerLayerEntity.renderComponent.addChild(cameraEntity.cameraComponent.cameraNode)
        playerLayerEntity.name = "PlayerLayerEntity"
        
        levelEntity.renderComponent.addChild(playerLayerEntity.renderComponent.node)
        
        /* Statische Entities hinzufügen */
        
        gameScene.entityManager.addEntity(levelEntity)
        gameScene.entityManager.addEntity(playerEntity)
        gameScene.entityManager.addEntity(cameraEntity)
        gameScene.entityManager.addEntity(playerLayerEntity)
        
        /* Dynamische Entities hinzufügen */
        
        for levelLayer in gameScene.dataSource.levelLayers() {
            
            let layerEntity = levelLayer.creationHandler(cameraEntity.cameraComponent)
            levelEntity.renderComponent.addChild(layerEntity.renderComponent.node)
            gameScene.entityManager.addEntity(layerEntity)
        }
        
        /* Input Handling */
        /*
        for inputSource in gameScene.sceneManager.gameInput.nativeControlInputSource {
            inputSource.delegate = playerEntity.inputComponent
        }*/
        
        gameScene.sceneManager.inputManager.nativeControlInputSource.delegate = playerEntity.inputComponent
    }
}
