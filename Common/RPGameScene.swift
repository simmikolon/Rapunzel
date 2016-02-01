//
//  RPGameScene.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import UIKit
import GameplayKit
import CoreMotion

struct RPInputHandlerSettings {
    
    static let AccelerationMultiplier: CGFloat = 600.0
    static let AccelerometerUpdateInterval = 0.2
}

class RPGameScene: RPScene {
    
    var entities = [GKEntity]()
    
    let contactDelegate = RPPhysicsWorldContactDelegate()
    
    private var lastUpdateTimeInterval: NSTimeInterval = 0
    private let maximumUpdateDeltaTime: NSTimeInterval = 1.0 / 60.0
    
    var platformLayerEntity: RPPlatformLayerEntity!
    
    // MARK: Constant Entities
    
    let worldEntity = RPWorldEntity()
    
    // MARK: Component Systems
    
    let inputSystem = GKComponentSystem(componentClass: RPInputComponent.self)
    let animationSystem = GKComponentSystem(componentClass: RPAnimationComponent.self)
    let cameraSystem = GKComponentSystem(componentClass: RPCameraComponent.self)
    let parallaxScrollingSystem = GKComponentSystem(componentClass: RPParallaxScrollingComponent.self)
    let intelligenceSystem = GKComponentSystem(componentClass: RPStateMachineComponent.self)
    
    // MARK: Scene Setup
    
    func setupCollisions() {
        
        RPColliderType.definedCollisions[.PlayerBot] = [
            .TaskBot,
            .Obstacle
        ]
        
        RPColliderType.definedCollisions[.Obstacle] = [
            .PlayerBot,
            .TaskBot
        ]
        
        RPColliderType.requestedContactNotifications[.PlayerBot] = [
            .TaskBot,
            .Obstacle
        ]
    }
    
    func buildLevel() {
        
        /* 1. Ertellen von RPWorldEntity */
        
        self.entities.append(worldEntity)
        self.addChild(worldEntity.renderComponent.node)
        
        /* 2. Erstellen von RPPlayerEntity */
        
        let playerEntity = RPPlayerEntity()
        self.entities.append(playerEntity)
        playerEntity.renderComponent.node.position = CGPoint(x: 0, y: 20)
        
        /* 3. Erstellen von Camera Layer */
        
        let cameraLayerEntity = RPCameraLayerEntity(focusedNode: playerEntity.renderComponent.node)
        self.entities.append(cameraLayerEntity)
        self.worldEntity.renderComponent.addChild(cameraLayerEntity.renderComponent.node)
        
        /* 4. Ertellen von RPActionLayerEntity */
        
        let actionLayerEntity = RPActionLayerEntity(cameraNode: cameraLayerEntity.cameraComponent.cameraNode)
        self.entities.append(actionLayerEntity)
        worldEntity.renderComponent.addChild(actionLayerEntity.renderComponent.node)
        
        /* 5. Erstellen von RPPlatformLayerEntity */
        
        let platformLayerEntity = RPPlatformLayerEntity(cameraNode: cameraLayerEntity.cameraComponent.cameraNode)
        self.entities.append(platformLayerEntity)
        self.platformLayerEntity = platformLayerEntity
        worldEntity.renderComponent.addChild(platformLayerEntity.renderComponent.node)
        
        /* 6. Hinzufügen von Player */
        
        actionLayerEntity.renderComponent.addChild(playerEntity.renderComponent.node)
        
        /* Hinzufügen der Components zu den jeweiligen Systemen */
        
        self.inputSystem.addComponent(playerEntity.inputComponent)
    }
    
    func setupScene() {
        
        self.anchorPoint = CGPoint(x: 0.5, y: 0.5)
        
        self.setupCollisions()
        self.setupPhysicsWorldContactDelegate()
        self.initCoreMotion()
        
        RPPlayerEntity.loadResourcesWithCompletionHandler { () -> () in
         
            self.buildLevel()
        }
    }
    
    // MARK: View Callbacks
    
    override func didMoveToView(view: SKView) {
        
        setupScene()
    }
    
    private func setupPhysicsWorldContactDelegate() {
        
        contactDelegate.setup()
        physicsWorld.contactDelegate = contactDelegate
    }
    
    override func update(currentTime: NSTimeInterval) {
        
        super.update(currentTime)
        
        guard view != nil else { return }
        
        var deltaTime = currentTime - lastUpdateTimeInterval
        deltaTime = deltaTime > maximumUpdateDeltaTime ? maximumUpdateDeltaTime : deltaTime
        
        lastUpdateTimeInterval = currentTime
        
        //if worldEntity.renderComponent.node.paused { return }
        
        //self.cameraSystem.updateWithDeltaTime(deltaTime)
        //self.parallaxScrollingSystem.updateWithDeltaTime(deltaTime)
        //self.intelligenceSystem.updateWithDeltaTime(deltaTime)
        
        for entity: GKEntity in self.entities {
            entity.updateWithDeltaTime(deltaTime)
        }
    }
    
    let motionManager = CMMotionManager()
    var xAcceleration: CGFloat = 0.0
    
    func initCoreMotion() {
        
        motionManager.accelerometerUpdateInterval = RPInputHandlerSettings.AccelerometerUpdateInterval
        
        motionManager.startAccelerometerUpdatesToQueue(NSOperationQueue.currentQueue()!, withHandler: {
            (accelerometerData: CMAccelerometerData?, error: NSError?) in
            
            let acceleration = accelerometerData!.acceleration
            self.xAcceleration = (CGFloat(acceleration.x) * 0.75) + (self.xAcceleration * 0.25)
            let xAcceleration = self.xAcceleration * RPInputHandlerSettings.AccelerationMultiplier
            
            for component: GKComponent in self.inputSystem.components {
                
                if let inputComponent: RPInputComponent = component as? RPInputComponent {
                    
                    inputComponent.didChangeMotion(xAcceleration)
                }
            }
        })
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        
        for component: GKComponent in self.inputSystem.components {
            
            if let inputComponent: RPInputComponent = component as? RPInputComponent {
                
                inputComponent.touchesBegan()
            }
        }
    }
    
    override func touchesMoved(touches: Set<UITouch>, withEvent event: UIEvent?) {

    }
    
    override func touchesEnded(touches: Set<UITouch>, withEvent event: UIEvent?) {

    }
}
