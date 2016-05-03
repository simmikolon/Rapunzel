//
//  RPLevel.swift
//  Rapunzel
//
//  Created by Simon Kemper on 03.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPLevel: GKEntity {
    
    var entities = [GKEntity]()
    
    // MARK: - Level Components
    
    let renderComponent: RPRenderComponent
    var patternControllerComponent: RPPatternControllerComponent!
    
    // MARK: - Constant Entities
    
    let playerEntity: RPPlayerEntity
    let cameraEntity: RPCameraEntity
    let playerLayerEntity: RPActionLayerEntity
    
    // MARK: - Component Systems
    
    let renderComponentSystem = GKComponentSystem(componentClass: RPRenderComponent.self)
    let cameraComponentSystem = GKComponentSystem(componentClass: RPCameraComponent.self)
    let parallaxScrollingComponentSystem = GKComponentSystem(componentClass: RPParallaxScrollingComponent.self)
    let animationComponentSystem = GKComponentSystem(componentClass: RPAnimationComponent.self)
    let stateMachineComponentSystem = GKComponentSystem(componentClass: RPStateMachineComponent.self)
    let tileComponentSystem = GKComponentSystem(componentClass: RPTileComponent.self)
    let lifecycleComponentSystem = GKComponentSystem(componentClass: RPLifecycleComponent.self)
    let patternControllerComponentSystem = GKComponentSystem(componentClass: RPPatternControllerComponent.self)
    
    // MARK: - Initialisation
    
    override init() {
        
        renderComponent = RPRenderComponent()
        renderComponentSystem.addComponent(renderComponent)
        
        /* Erstellen von RPPlayerEntity */
        
        playerEntity = RPPlayerEntity()
        playerEntity.renderComponent.node.zPosition = 60
        playerEntity.renderComponent.node.position = CGPoint(x: 0, y: 150)
        
        /* Camera Entity erstellen und Hinzufügen */
        
        cameraEntity = RPCameraEntity(withFocusedNode: playerEntity.renderComponent.node)
        
        /* Erstellen von RPActionLayerEntity */
        
        playerLayerEntity = RPActionLayerEntity(cameraComponent: cameraEntity.cameraComponent, zPosition: 5)
        playerLayerEntity.renderComponent.addChild(playerEntity.renderComponent.node)
        playerLayerEntity.renderComponent.addChild(cameraEntity.cameraComponent.cameraNode)
        
        renderComponent.addChild(playerLayerEntity.renderComponent.node)
        
        super.init()
        
        /* Create Pattern Controller Component */
        
        patternControllerComponent = RPPatternControllerComponent(withLayerEntity: playerLayerEntity, pattern: demoPattern)
        patternControllerComponentSystem.addComponent(patternControllerComponent)
        
        renderComponent.node.entity = self;
        
        addEntity(playerEntity)
        addEntity(cameraEntity)
        addEntity(playerLayerEntity)
    }
    
    // MARK: - Entity Management
    
    func addEntity(entity: GKEntity) {
        entities.append(entity)
        renderComponentSystem.addComponentWithEntity(entity)
        cameraComponentSystem.addComponentWithEntity(entity)
        parallaxScrollingComponentSystem.addComponentWithEntity(entity)
        animationComponentSystem.addComponentWithEntity(entity)
        stateMachineComponentSystem.addComponentWithEntity(entity)
        tileComponentSystem.addComponentWithEntity(entity)
        lifecycleComponentSystem.addComponentWithEntity(entity)
    }
    
    // MARK: - Lifecycle
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        renderComponentSystem.updateWithDeltaTime(seconds)
        cameraComponentSystem.updateWithDeltaTime(seconds)
        parallaxScrollingComponentSystem.updateWithDeltaTime(seconds)
        animationComponentSystem.updateWithDeltaTime(seconds)
        stateMachineComponentSystem.updateWithDeltaTime(seconds)
        tileComponentSystem.updateWithDeltaTime(seconds)
        lifecycleComponentSystem.updateWithDeltaTime(seconds)
    }
    
    var demoPattern: RPPattern {
        
        let pattern = RPPattern(withNumberOfBeats: 2)
        
        pattern.beats[0] = RPBeat(withType: .NotEmpty)
        pattern.beats[0].elements.append(RPBeatElement(withType: RPBeatElementType.LeftTreePlatform, creationHandler: {
            offset in
            
            let platform = RPLeftBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 320
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            //platform.delegate = self.treeLayerEntity.entityManagerComponent
            //self.treeLayerEntity.entityManagerComponent.entities.append(platform)
            //self.treeLayerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
        }))
        pattern.beats[0].elements.append(RPBeatElement(withType: RPBeatElementType.LeftTreePlatform, creationHandler: {
            offset in
            
            let platform = RPHairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 20
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            //platform.delegate = self.treeLayerEntity.entityManagerComponent
            //self.treeLayerEntity.entityManagerComponent.entities.append(platform)
            //self.hairLayerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
        }))
        
        /**/
        
        pattern.beats[1] = RPBeat(withType: .NotEmpty)
        pattern.beats[1].elements.append(RPBeatElement(withType: RPBeatElementType.RightTreePlatform, creationHandler: {
            offset in
            
            let platform = RPBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -320
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            //platform.delegate = self.treeLayerEntity.entityManagerComponent
            //self.treeLayerEntity.entityManagerComponent.entities.append(platform)
            //self.treeLayerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
        }))
        pattern.beats[1].elements.append(RPBeatElement(withType: RPBeatElementType.LeftTreePlatform, creationHandler: {
            offset in
            
            let platform = RPHairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -20
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            //platform.delegate = self.treeLayerEntity.entityManagerComponent
            //self.treeLayerEntity.entityManagerComponent.entities.append(platform)
            //self.hairLayerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
        }))
        
        
        return pattern
    }

}
