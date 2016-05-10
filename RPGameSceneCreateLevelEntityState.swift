//
//  RPGameSceneCreateLevelLayerState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class RPGameSceneCreateLevelEntityState: RPGameSceneState {

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        createScene()
        gameScene.stateMachine.enterState(RPGameScenePlayingState.self)
    }
    
    private func createScene() {
        
        let levelEntity = RPLevelEntity()
        levelEntity.name = "RPLevelEntity"
        gameScene.addChild(levelEntity.renderComponent.node)
        
        /* Erstellen von RPPlayerEntity */
        
        let playerEntity = RPPlayerEntity()
        playerEntity.renderComponent.node.zPosition = 60
        playerEntity.renderComponent.node.position = CGPoint(x: 0, y: 150)
        playerEntity.name = "RPPlayerEntity"
        
        /* Camera Entity erstellen und Hinzufügen */
        
        let cameraEntity = RPCameraEntity(withFocusedNode: playerEntity.renderComponent.node)
        cameraEntity.name = "RPCameraEntity"
        
        /* Erstellen von RPActionLayerEntity */
        
        let playerLayerEntity = RPActionLayerEntity(cameraComponent: cameraEntity.cameraComponent, zPosition: 5)
        playerLayerEntity.renderComponent.addChild(playerEntity.renderComponent.node)
        playerLayerEntity.renderComponent.addChild(cameraEntity.cameraComponent.cameraNode)
        playerLayerEntity.name = "RPPlayerLayerEntity"
        
        levelEntity.renderComponent.addChild(playerLayerEntity.renderComponent.node)
        
        /* Statische Entities hinzufügen */
        
        gameScene.entityManagerComponent.addEntity(levelEntity)
        gameScene.entityManagerComponent.addEntity(playerEntity)
        gameScene.entityManagerComponent.addEntity(cameraEntity)
        gameScene.entityManagerComponent.addEntity(playerLayerEntity)
        
        /* Dynamische Entities hinzufügen */
        
        for levelLayer in gameScene.dataSource.levelLayers() {
            
            let layerEntity = levelLayer.creationHandler(cameraEntity.cameraComponent)
            levelEntity.renderComponent.addChild(layerEntity.renderComponent.node)
            gameScene.entityManagerComponent.addEntity(layerEntity)
        }
        
        /* Pattern Controller Component initialisieren */
        
        let patternControllerEntity = RPPatternControllerEntity(withLayerEntity: playerLayerEntity,
                                                                pattern: gameScene.dataSource.demoPattern(),
                                                                entityManagerComponent: gameScene.entityManagerComponent)
        
        patternControllerEntity.name = "RPPatternControllerEntity"
        
        gameScene.entityManagerComponent.addEntity(patternControllerEntity)
        
        /* Input Manager Entity */
        
        let inputManagerEntity = RPInputManagerEntity(withEntityManagerComponent: gameScene.entityManagerComponent)
        inputManagerEntity.name = "RPInputManagerEntity"
        gameScene.entityManagerComponent.addEntity(inputManagerEntity)
    }
}
