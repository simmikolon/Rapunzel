//
//  RPGameScene.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
//import UIKit
import GameplayKit

#if os(iOS)
    import CoreMotion
#endif

struct RPInputHandlerSettings {
    
    static let AccelerationMultiplier: CGFloat = 1000.0
    static let AccelerometerUpdateInterval = 0.1
}

class RPGameScene: RPScene, RPPlayerStateDelegate {
    
    // MARK: Class Methods
    
    static weak var sharedGameScene: RPGameScene!
    
    // MARK: Instance Methods
    
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
    
    // MARK: Initialisation
    
    override init(size: CGSize) {
        super.init(size: size)
        RPGameScene.sharedGameScene = self
    }
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        RPGameScene.sharedGameScene = self
    }
    
    // MARK: Scene Setup
    
    func setupCollisions() {
        
        RPColliderType.definedCollisions[.PlayerBot] = [
            .TaskBot,
            //.NormalPlatform,
            //.BottomCollidablePlatform
        ]
        
        RPColliderType.definedCollisions[.NormalPlatform] = [
            .PlayerBot,
            .TaskBot
        ]
        
        RPColliderType.requestedContactNotifications[.PlayerBot] = [
            .TaskBot,
            .NormalPlatform,
            .BottomCollidablePlatform
        ]
        
        RPColliderType.requestedContactNotifications[.NormalPlatform] = [
            .TaskBot,
            .PlayerBot
        ]
        
        RPColliderType.requestedContactNotifications[.BottomCollidablePlatform] = [
            .TaskBot,
            .PlayerBot
        ]
    }
    
    func playerDidFallDown() {
        
        self.paused = true
        self.entities.removeAll()

        //let screenSize = CGSize(width: RPGameSceneSettings.width, height: RPGameSceneSettings.height)
        
        //self.view!.presentScene(RPGameOverScene(size: screenSize))
    }
    
    func buildLevel() {
        
        /* 1. Ertellen von RPWorldEntity */
        
        self.entities.append(worldEntity)
        self.addChild(worldEntity.renderComponent.node)
        
        
        
        /* 2. Erstellen von RPPlayerEntity */
        
        let playerEntity = RPPlayerEntity()
        self.entities.append(playerEntity)
        playerEntity.renderComponent.node.zPosition = 60
        playerEntity.renderComponent.node.position = CGPoint(x: 0, y: 150)
        playerEntity.playerStateDelegate = self
        self.inputSystem.addComponent(playerEntity.inputComponent)
        
        
        
        /* 3. Camera Entity erstellen und Hinzufügen */
        
        let cameraEntity = RPCameraEntity(withFocusedNode: playerEntity.renderComponent.node)
        self.entities.append(cameraEntity)
        
        
        
        /* 4. Ertellen von RPActionLayerEntity */
        
        let actionLayerEntity = RPActionLayerEntity(cameraComponent: cameraEntity.cameraComponent, zPosition: 5)
        self.entities.append(actionLayerEntity)
        worldEntity.renderComponent.addChild(actionLayerEntity.renderComponent.node)
        
        actionLayerEntity.renderComponent.addChild(playerEntity.renderComponent.node)
        actionLayerEntity.renderComponent.addChild(cameraEntity.cameraComponent.cameraNode)
        
        
        
        /* Background Layer */
        
        /* Erstellung von Far Background Layer */
        
        let farBackgroundLayerEntity = RPFarBackgroundLayerEntity(withParallaxFactor: 8.0, cameraComponent: cameraEntity.cameraComponent, zPosition: -5)
        self.entities.append(farBackgroundLayerEntity)
        self.worldEntity.renderComponent.addChild(farBackgroundLayerEntity.renderComponent.node)
        
        /* Erstellen von Background Layer */
        
        let backgroundLayerEntity = RPBackgroundLayerEntity(withParallaxFactor: 3.0, cameraComponent: cameraEntity.cameraComponent, zPosition: -3)
        self.entities.append(backgroundLayerEntity)
        self.worldEntity.renderComponent.addChild(backgroundLayerEntity.renderComponent.node)
        
        /* Erstellen von Tower Layer */
        
        let towerLayerEntity = RPTowerLayerEntity(withParallaxFactor: 2.0, cameraComponent: cameraEntity.cameraComponent, zPosition: -2)
        self.entities.append(towerLayerEntity)
        self.worldEntity.renderComponent.addChild(towerLayerEntity.renderComponent.node)
        
        /* Erstellen von Hair Layer */
        
        let hairLayerEntity = RPHairLayerEntity(withParallaxFactor: 2.0, cameraComponent: cameraEntity.cameraComponent, zPosition: -1)
        self.entities.append(hairLayerEntity)
        self.worldEntity.renderComponent.addChild(hairLayerEntity.renderComponent.node)
        
        /* Erstellen von Tree Layer */
        
        let treeLayerEntity = RPTreeLayerEntity(withParallaxFactor: 1.5, cameraComponent: cameraEntity.cameraComponent, zPosition: 1)
        self.entities.append(treeLayerEntity)
        self.worldEntity.renderComponent.addChild(treeLayerEntity.renderComponent.node)
        
        /* Erstellen von Particle Layer */
        
        var particleLayerEntity = RPParticleLayerEntity(withParallaxFactor: 4.0, cameraComponent: cameraEntity.cameraComponent, zPosition: -2, numberOfColumns: 2, numberOfRows: 2, damping: 25.0)
        self.entities.append(particleLayerEntity)
        self.worldEntity.renderComponent.addChild(particleLayerEntity.renderComponent.node)
        
        /* Erstellen von Particle Layer */
        
        particleLayerEntity = RPParticleLayerEntity(withParallaxFactor: 2.0, cameraComponent: cameraEntity.cameraComponent, zPosition: 2, numberOfColumns: 2, numberOfRows: 2, damping: 15.0)
        self.entities.append(particleLayerEntity)
        self.worldEntity.renderComponent.addChild(particleLayerEntity.renderComponent.node)
        
        /* Erstellen von RPPlatformLayerEntity */
        /*
        let platformLayerEntity = RPPlatformLayerEntity(withParallaxFactor: 2.0, cameraNode: cameraEntity.cameraComponent.cameraNode, zPosition: 0)
        self.entities.append(platformLayerEntity)
        self.platformLayerEntity = platformLayerEntity
        worldEntity.renderComponent.addChild(platformLayerEntity.renderComponent.node)*/

    }
    
    func setupScene() {
        
        self.backgroundColor = SKColor(red: 30/255, green: 60/255, blue: 63/255, alpha: 1)
        self.anchorPoint = CGPoint(x: 0.5, y: 0)
        
        //self.physicsWorld.speed = 1.25
        //self.physicsWorld.gravity = CGVector(dx: 0, dy: 0)
        
        self.setupCollisions()
        self.setupPhysicsWorldContactDelegate()
        
        #if os(iOS)
        self.initCoreMotion()
        #endif
        
        RPDebugPlatformEntity.loadResourcesWithCompletionHandler { () -> () in
         
            RPPlayerEntity.loadResourcesWithCompletionHandler { () -> () in
                
                RPTreeLayerEntity.loadResourcesWithCompletionHandler({ () -> () in
                    
                    RPTowerLayerEntity.loadResourcesWithCompletionHandler({ () -> () in
                        
                        RPBackgroundLayerEntity.loadResourcesWithCompletionHandler({ () -> () in
                          
                            RPHairLayerEntity.loadResourcesWithCompletionHandler({ () -> () in
                                
                                RPHairRibbonPlatformEntity.loadResourcesWithCompletionHandler({ () -> () in
                                    
                                    RPFarBackgroundLayerEntity.loadResourcesWithCompletionHandler({ () -> () in
                                        
                                        //RPLightRayLayerEntity.loadResourcesWithCompletionHandler({ () -> () in
                                          
                                            RPBranchPlatformEntity.loadResourcesWithCompletionHandler({ () -> () in
                                              
                                                RPLeftBranchPlatformEntity.loadResourcesWithCompletionHandler({ () -> () in
                                                  
                                                    self.runAction(SKAction.waitForDuration(2.0), completion: { () -> Void in
                                                        self.buildLevel()
                                                    })
                                                    
                                                })
                                            })
                                        //})
                                    })
                                })
                            })
                        })
                    })
                })
            }
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
    
    #if os(iOS)
    
    let motionManager = CMMotionManager()
    var xAcceleration: CGFloat = 0.0
    
    func initCoreMotion() {
        
        motionManager.accelerometerUpdateInterval = RPInputHandlerSettings.AccelerometerUpdateInterval
        
        motionManager.startAccelerometerUpdatesToQueue(NSOperationQueue.currentQueue()!, withHandler: {
            (accelerometerData: CMAccelerometerData?, error: NSError?) in
            
            let acceleration = accelerometerData!.acceleration
            self.xAcceleration = (CGFloat(acceleration.x) * 0.5) + (self.xAcceleration * 0.75)
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
    
    #else
    
    override func keyDown(theEvent: NSEvent) {
        
        switch theEvent.keyCode {
            
        case 49:
            for component: GKComponent in self.inputSystem.components {
                
                if let inputComponent: RPInputComponent = component as? RPInputComponent {
                    
                    inputComponent.touchesBegan()
                }
            }
            break
            
        case 123:
            for component: GKComponent in self.inputSystem.components {
                
                if let inputComponent: RPInputComponent = component as? RPInputComponent {
                    
                    inputComponent.keyLeftDown()
                }
            }
            break
            
        case 124:
            for component: GKComponent in self.inputSystem.components {
                
                if let inputComponent: RPInputComponent = component as? RPInputComponent {
                    
                    inputComponent.keyRightDown()
                }
            }
            break
            
        default:
            break
        }

    }
    
    override func keyUp(theEvent: NSEvent) {
        
        switch theEvent.keyCode {
            
        case 123:
            for component: GKComponent in self.inputSystem.components {
                
                if let inputComponent: RPInputComponent = component as? RPInputComponent {
                    
                    inputComponent.keyLeftUp()
                }
            }
            break
            
        case 124:
            for component: GKComponent in self.inputSystem.components {
                
                if let inputComponent: RPInputComponent = component as? RPInputComponent {
                    
                    inputComponent.keyRightUp()
                }
            }
            break
            
        default:
            break
        }
    }
    
    #endif
    
    deinit {
        print("deinit scene")
    }
}
