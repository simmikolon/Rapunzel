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
    
    var levelEntity: RPLevelEntity!
    
    // MARK: - State Machine
    
    lazy var stateMachine: GKStateMachine = {
        
        return GKStateMachine(states: [
            RPGameSceneInitState(withGameScene: self),
            RPGameSceneResourceLoadingState(withGameScene: self),
            RPGameSceneFinishLoadingResourcesState(withGameScene: self),
            RPGameSceneCreateLevelEntityState(withGameScene: self)
        ])
    }()
    
    // MARK: - Data Source
    
    let dataSource: RPLevelDataSource = RPDemoLevelDataSource()
    
    // MARK: - Contact Delegate
    
    let contactDelegate = RPPhysicsWorldContactDelegate()
    
    // MARK: - Properties
    
    private var lastUpdateTimeInterval: NSTimeInterval = 0
    private let maximumUpdateDeltaTime: NSTimeInterval = 1.0 / 60.0
    
    // MARK: - Initialisation
    
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
        
        paused = true
    }
    
    func setupScene() {
        
        backgroundColor = SKColor(red: 30/255, green: 60/255, blue: 63/255, alpha: 1)
        anchorPoint = CGPoint(x: 0.5, y: 0)
        
        setupCollisions()
        setupPhysicsWorldContactDelegate()
        
        #if os(iOS)
        initCoreMotion()
        #endif
        
        stateMachine.enterState(RPGameSceneInitState.self)
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
        
        if let levelEntity = self.levelEntity {
         
            levelEntity.updateWithDeltaTime(currentTime)
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
            
            if let levelEntity = self.levelEntity {
             
                for componentSystem in levelEntity.entityManagerComponent.componentSystems {
                    
                    if componentSystem.componentClass == RPInputComponent.self {
                        
                        for component: GKComponent in componentSystem.components {
                            
                            if let inputComponent: RPInputComponent = component as? RPInputComponent {
                                
                                inputComponent.didChangeMotion(xAcceleration)
                            }
                        }
                    }
                }
            }
        })
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        
        for componentSystem in levelEntity.entityManagerComponent.componentSystems {
            
            if componentSystem.componentClass == RPInputComponent.self {
         
                for component: GKComponent in componentSystem.components {
                    
                    if let inputComponent: RPInputComponent = component as? RPInputComponent {
                        
                        inputComponent.touchesBegan()
                    }
                }
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
            
            for componentSystem in levelEntity.entityManagerComponent.componentSystems {
                
                if componentSystem.componentClass == RPInputComponent.self {
                    
                    for component: GKComponent in componentSystem.components {
                        
                        if let inputComponent: RPInputComponent = component as? RPInputComponent {
                            
                            inputComponent.touchesBegan()
                        }
                    }
                }
            }
            
            break
            
        case 123:
            
            for componentSystem in levelEntity.entityManagerComponent.componentSystems {
                
                if componentSystem.componentClass == RPInputComponent.self {
                    
                    for component: GKComponent in componentSystem.components {
                        
                        if let inputComponent: RPInputComponent = component as? RPInputComponent {
                            
                            inputComponent.keyLeftDown()
                        }
                    }
                }
            }
            
            break
            
        case 124:
            
            for componentSystem in levelEntity.entityManagerComponent.componentSystems {
                
                if componentSystem.componentClass == RPInputComponent.self {
                    
                    for component: GKComponent in componentSystem.components {
                        
                        if let inputComponent: RPInputComponent = component as? RPInputComponent {
                            
                            inputComponent.keyRightDown()
                        }
                    }
                    
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
            
            for componentSystem in levelEntity.entityManagerComponent.componentSystems {
                
                if componentSystem.componentClass == RPInputComponent.self {
                    
                    for component: GKComponent in componentSystem.components {
                        
                        if let inputComponent: RPInputComponent = component as? RPInputComponent {
                            
                            inputComponent.keyLeftUp()
                        }
                    }
                }
            }
            
            break
            
        case 124:
            
            for componentSystem in levelEntity.entityManagerComponent.componentSystems {
                
                if componentSystem.componentClass == RPInputComponent.self {
                    
                    for component: GKComponent in componentSystem.components {
                        
                        if let inputComponent: RPInputComponent = component as? RPInputComponent {
                            
                            inputComponent.keyRightUp()
                        }
                    }
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
