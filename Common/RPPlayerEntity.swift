//
//  PlayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import SpriteKit
import GameplayKit

enum PlayerAnimationName: String {

    case BounceDown = "RPPlayerBounceDown"
    case BounceUp = "RPPlayerBounceUp"
    case FallingDown = "RPPlayerFallingDown"
    case JumpUp = "RPPlayerJumpUp"
    case Standing = "RPPlayerStanding"
    case BoostingUp = "RPPlayerBoostingUp"
    
    static let atlasNames = [
        
        Standing.rawValue,
        BounceDown.rawValue,
        BounceUp.rawValue,
        FallingDown.rawValue,
        JumpUp.rawValue,
        BoostingUp.rawValue
    ]
}

class PlayerEntity: Entity, ContactNotifiableType, ResourceLoadableType, PlayerStateDelegate {
    
    static var textureSize = CGSize(width: 104, height: 232)
    static var animations: [String: Animation]!
    
    weak var playerStateDelegate: PlayerStateDelegate?
    
    // MARK: Components
    
    let renderComponent: RenderComponent
    let physicsComponent: GravityPhysicsComponent
    let inputComponent: InputComponent
    var stateMachineComponent: StateMachineComponent!
    let animationComponent: AnimationComponent
    
    // MARK: Initialisation
    
    override init() {
        
        /* Component Initialisation before super.init() */
        
        physicsComponent = GravityPhysicsComponent(physicsBody: SKPhysicsBody(rectangleOfSize: CGSize(width: 30, height: 232)), colliderType: .PlayerBot)
        renderComponent = RenderComponent()
        inputComponent = InputComponent()
        
        /* Animation Component */
        
        guard let animations = PlayerEntity.animations else { fatalError() }
        
        animationComponent = AnimationComponent(textureSize: PlayerEntity.textureSize, animations: animations)
        animationComponent.requestedAnimation = PlayerAnimationName.Standing.rawValue
        
        renderComponent.addChild(animationComponent.node)
        
        super.init()
        
        /* State Machine */
        
        stateMachineComponent = StateMachineComponent(states: [
            
            PlayerStandingState(entity: self, delegate: self),
            PlayerFallingState(entity: self, delegate: self),
            PlayerBouncingDownState(entity: self, delegate: self),
            PlayerBouncingUpState(entity: self, delegate: self),
            PlayerJumpingState(entity: self, delegate: self),
            PlayerBoostState(entity: self, delegate: self),
            PlayerBottomCollisionState(entity: self, delegate: self)
            
            ])
        
        stateMachineComponent.enterInitialState()
        
        /* Render Component Setup after super.init() */
        
        renderComponent.node.entity = self
        renderComponent.node.entity = self
        renderComponent.node.physicsBody = physicsComponent.physicsBody
        
        /* Input Component */

        addComponent(physicsComponent)
        addComponent(renderComponent)
        addComponent(inputComponent)
        addComponent(stateMachineComponent)
        addComponent(animationComponent)
    }
    
    // MARK: Input Component Delegate Methods
    // TODO: Out-Sourcing input Methods as States and implement State Machine into InputComponent!
    
    func didTap() {
        
        self.stateMachineComponent.stateMachine.enterState(PlayerBoostState.self)
    }
    
    func didChangeMotion(xAcceleration: CGFloat) {

        //physicsComponent.physicsBody.velocity = CGVector(dx: xAcceleration, dy: physicsComponent.physicsBody.velocity.dy)
    }
    
    /**/
    
    var isKeyRightDown = false
    var isKeyLeftDown = false
    
    func keyRightDown() {
        
        isKeyRightDown = true
        isKeyLeftDown = false
    }
    
    func keyRightUp() {
        
        isKeyRightDown = false
    }
    
    func keyLeftDown() {
        
        isKeyLeftDown = true
        isKeyRightDown = false
    }
    
    func keyLeftUp() {
        
        isKeyLeftDown = false
    }
    
    // MARK: Player State Delegate
    
    func playerDidFallDown() {
        
        guard let playerStateDelegate = self.playerStateDelegate else {
            fatalError("Player Needs Delegate!")
        }
        
        playerStateDelegate.playerDidFallDown()
    }
}

extension PlayerEntity {
    
    func contactWithEntityDidBegin(entity: GKEntity) {
        
        self.stateMachineComponent.contactWithEntityDidBegin(entity)
    }
    
    func contactWithEntityDidEnd(entity: GKEntity) {
        
        self.stateMachineComponent.contactWithEntityDidEnd(entity)
    }
}

extension PlayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return animations == nil
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(PlayerAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            
            for i in 0 ..< atlases.count {
                
                animations[PlayerAnimationName.atlasNames[i]] = AnimationComponent.animationsFromAtlas(atlases[i])
            }
            
            completionHandler()
        }
    }
    
    static func purgeResources() {

        animations = nil
    }
    
}
