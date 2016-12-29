//
//  BranchPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 03.03.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

enum BranchPlatformAnimationName: String {
    
    case Normal = "RPBranchPlatformNormal"
    case JumpingOn = "RPBranchPlatformJumpingOn"
    case JumpingOff = "RPBranchPlatformJumpingOff"
    case BottomHit = "RPBranchPlatformBottomHit"
    
    static let atlasNames = [
        
        Normal.rawValue,
        JumpingOn.rawValue,
        JumpingOff.rawValue,
        BottomHit.rawValue
    ]
}

class BranchPlatformEntity: PlatformEntity, ResourceLoadableType {
    
    static var animations: [String: Animation]!
    
    init(isBreakable breakable: Bool, isBottomCollidable bottomCollidable: Bool) {
        
        guard let animations = BranchPlatformEntity.animations else {
            fatalError()
        }
        
        super.init(isBreakable: breakable, isBottomCollidable: bottomCollidable, animations: animations)
        
        animationComponent.requestedAnimation = PlatformAnimationName.Normal.rawValue
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

extension BranchPlatformEntity {
    
    static var resourcesNeedLoading: Bool {
        return animations == nil
    }
    
    static func loadResources(withCompletionHandler completionHandler: @escaping () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(BranchPlatformAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            
            animations[PlatformAnimationName.Normal.rawValue] = AnimationComponent.animationsFromAtlas(atlases[0])
            animations[PlatformAnimationName.JumpingOn.rawValue] = AnimationComponent.animationsFromAtlas(atlases[1])
            animations[PlatformAnimationName.JumpingOff.rawValue] = AnimationComponent.animationsFromAtlas(atlases[2])
            animations[PlatformAnimationName.BottomHit.rawValue] = AnimationComponent.animationsFromAtlas(atlases[3])
            
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        animations = nil
    }
    
}

